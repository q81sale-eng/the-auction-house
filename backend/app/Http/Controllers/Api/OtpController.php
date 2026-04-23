<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PhoneVerification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OtpController extends Controller
{
    private const OTP_TTL_MINUTES = 10;
    private const MAX_ATTEMPTS    = 5;
    private const RESEND_COOLDOWN = 60; // seconds

    public function send(Request $request)
    {
        $request->validate(['phone' => 'required|string|max:20']);

        $phone = $this->normalizePhone($request->input('phone'));

        // Cooldown: block resend if a valid, recent OTP exists
        $recent = PhoneVerification::where('phone', $phone)
            ->where('expires_at', '>', now())
            ->where('verified_at', null)
            ->latest()
            ->first();

        if ($recent && $recent->created_at->diffInSeconds(now()) < self::RESEND_COOLDOWN) {
            return response()->json([
                'message'    => 'يرجى الانتظار قبل طلب رمز جديد',
                'retry_after' => self::RESEND_COOLDOWN - $recent->created_at->diffInSeconds(now()),
            ], 429);
        }

        // Invalidate old OTPs for this phone
        PhoneVerification::where('phone', $phone)
            ->whereNull('verified_at')
            ->delete();

        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        PhoneVerification::create([
            'phone'      => $phone,
            'otp'        => $otp,
            'expires_at' => now()->addMinutes(self::OTP_TTL_MINUTES),
        ]);

        $sent = $this->sendWhatsApp($phone, $otp);

        if (!$sent) {
            Log::warning('WhatsApp OTP send failed for ' . $phone);
            return response()->json(['message' => 'تعذّر إرسال الرمز عبر واتساب، يرجى المحاولة لاحقاً'], 503);
        }

        return response()->json([
            'message' => 'تم إرسال رمز التحقق عبر واتساب',
            'expires_in' => self::OTP_TTL_MINUTES * 60,
        ]);
    }

    public function verify(Request $request)
    {
        $request->validate([
            'phone' => 'required|string|max:20',
            'otp'   => 'required|string|size:6',
        ]);

        $phone = $this->normalizePhone($request->input('phone'));
        $otp   = $request->input('otp');

        $record = PhoneVerification::where('phone', $phone)
            ->whereNull('verified_at')
            ->where('expires_at', '>', now())
            ->latest()
            ->first();

        if (!$record) {
            return response()->json(['message' => 'الرمز منتهي الصلاحية، يرجى طلب رمز جديد'], 422);
        }

        if ($record->attempts >= self::MAX_ATTEMPTS) {
            $record->delete();
            return response()->json(['message' => 'تجاوزت الحد المسموح من المحاولات، يرجى طلب رمز جديد'], 422);
        }

        if ($record->otp !== $otp) {
            $record->increment('attempts');
            return response()->json(['message' => 'رمز التحقق غير صحيح'], 422);
        }

        $record->update(['verified_at' => now()]);

        return response()->json(['verified' => true, 'phone' => $phone]);
    }

    private function normalizePhone(string $phone): string
    {
        $phone = preg_replace('/\s+/', '', $phone);
        if (!str_starts_with($phone, '+')) {
            $phone = '+' . ltrim($phone, '0');
        }
        return $phone;
    }

    private function sendWhatsApp(string $phone, string $otp): bool
    {
        $instanceId = config('services.ultramsg.instance_id');
        $token      = config('services.ultramsg.token');

        if (!$instanceId || !$token) {
            Log::warning('Ultramsg credentials not configured');
            return false;
        }

        $message = "رمز التحقق الخاص بك في *The Auction House*:\n\n*{$otp}*\n\nصالح لمدة " . self::OTP_TTL_MINUTES . " دقائق.\nلا تشارك هذا الرمز مع أحد.";

        try {
            $response = Http::asForm()->post(
                "https://api.ultramsg.com/{$instanceId}/messages/chat",
                [
                    'token' => $token,
                    'to'    => $phone,
                    'body'  => $message,
                ]
            );

            return $response->successful() && ($response->json('sent') === 'true' || isset($response->json()['id']));
        } catch (\Throwable $e) {
            Log::error('Ultramsg exception: ' . $e->getMessage());
            return false;
        }
    }
}
