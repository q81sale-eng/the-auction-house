<?php

namespace Database\Seeders;

use App\Models\Auction;
use App\Models\Bid;
use App\Models\MarketplaceListing;
use App\Models\User;
use App\Models\Valuation;
use App\Models\Watch;
use App\Models\WatchImage;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@theauctionhouse.com',
            'password' => Hash::make('password'),
            'is_admin' => true,
            'is_verified' => true,
            'deposit_balance' => 0,
        ]);

        $user = User::create([
            'name' => 'John Collector',
            'email' => 'john@example.com',
            'password' => Hash::make('password'),
            'is_admin' => false,
            'is_verified' => true,
            'deposit_balance' => 5000,
            'country' => 'United Kingdom',
        ]);

        $watches = [
            ['brand' => 'Rolex', 'model' => 'Submariner', 'reference_number' => '126610LN', 'year' => 2023, 'movement' => 'automatic', 'case_material' => 'Oystersteel', 'bracelet_material' => 'Oystersteel', 'case_diameter' => 41.0, 'dial_color' => 'Black', 'condition' => 'new', 'has_box' => true, 'has_papers' => true, 'water_resistance' => '300m', 'description' => 'Brand new Rolex Submariner in perfect condition with full set.'],
            ['brand' => 'Patek Philippe', 'model' => 'Nautilus', 'reference_number' => '5711/1A-010', 'year' => 2021, 'movement' => 'automatic', 'case_material' => 'Stainless Steel', 'bracelet_material' => 'Stainless Steel', 'case_diameter' => 40.0, 'dial_color' => 'Blue', 'condition' => 'excellent', 'has_box' => true, 'has_papers' => true, 'water_resistance' => '120m', 'description' => 'The legendary Patek Philippe Nautilus ref. 5711 with blue dial.'],
            ['brand' => 'Audemars Piguet', 'model' => 'Royal Oak', 'reference_number' => '15500ST.OO.1220ST.01', 'year' => 2022, 'movement' => 'automatic', 'case_material' => 'Stainless Steel', 'bracelet_material' => 'Stainless Steel', 'case_diameter' => 41.0, 'dial_color' => 'Blue', 'condition' => 'excellent', 'has_box' => true, 'has_papers' => true, 'water_resistance' => '50m', 'description' => 'Iconic Royal Oak in excellent condition.'],
            ['brand' => 'A. Lange & Söhne', 'model' => 'Lange 1', 'reference_number' => '101.039', 'year' => 2019, 'movement' => 'manual', 'case_material' => 'White Gold', 'bracelet_material' => 'Alligator Leather', 'case_diameter' => 38.5, 'dial_color' => 'Silver', 'condition' => 'excellent', 'has_box' => true, 'has_papers' => true, 'description' => 'German watchmaking at its finest.'],
            ['brand' => 'F.P. Journe', 'model' => 'Chronomètre Bleu', 'reference_number' => 'CB38', 'year' => 2020, 'movement' => 'manual', 'case_material' => 'Tantalum', 'bracelet_material' => 'Alligator Leather', 'case_diameter' => 38.0, 'dial_color' => 'Blue', 'condition' => 'excellent', 'has_box' => true, 'has_papers' => true, 'description' => 'The iconic F.P. Journe chronometer with stunning blue dial.'],
        ];

        foreach ($watches as $watchData) {
            $slug = Str::slug($watchData['brand'] . '-' . $watchData['model'] . '-' . Str::random(6));
            $watch = Watch::create(array_merge($watchData, ['slug' => $slug]));

            // Placeholder image
            WatchImage::create([
                'watch_id' => $watch->id,
                'path' => 'images/placeholder-watch.jpg',
                'alt_text' => $watchData['brand'] . ' ' . $watchData['model'],
                'is_primary' => true,
                'sort_order' => 0,
            ]);
        }

        $watches = Watch::all();

        // Live auction
        $auction1 = Auction::create([
            'watch_id' => $watches[0]->id,
            'seller_id' => $admin->id,
            'title' => 'Rolex Submariner 126610LN - Full Set 2023',
            'description' => 'Rare opportunity to acquire a brand new Submariner.',
            'starting_price' => 12000,
            'reserve_price' => 14000,
            'current_bid' => 13500,
            'buy_now_price' => 18000,
            'bid_increment' => 250,
            'deposit_required' => 1000,
            'winning_bidder_id' => $user->id,
            'starts_at' => now()->subHours(2),
            'ends_at' => now()->addHours(22),
            'auto_extend' => true,
            'extend_minutes' => 5,
            'status' => 'live',
            'slug' => 'rolex-submariner-126610ln-' . Str::random(6),
        ]);

        Bid::create(['auction_id' => $auction1->id, 'user_id' => $user->id, 'amount' => 13500, 'is_winning' => true, 'status' => 'active']);
        Bid::create(['auction_id' => $auction1->id, 'user_id' => $admin->id, 'amount' => 13250, 'is_winning' => false, 'status' => 'outbid']);
        Bid::create(['auction_id' => $auction1->id, 'user_id' => $user->id, 'amount' => 13000, 'is_winning' => false, 'status' => 'outbid']);

        // Upcoming auction
        Auction::create([
            'watch_id' => $watches[1]->id,
            'seller_id' => $admin->id,
            'title' => 'Patek Philippe Nautilus 5711 Blue Dial',
            'description' => 'The most sought-after sports watch in the world.',
            'starting_price' => 80000,
            'reserve_price' => 90000,
            'buy_now_price' => 130000,
            'bid_increment' => 1000,
            'deposit_required' => 5000,
            'starts_at' => now()->addDays(2),
            'ends_at' => now()->addDays(7),
            'auto_extend' => true,
            'extend_minutes' => 10,
            'status' => 'upcoming',
            'slug' => 'patek-nautilus-5711-' . Str::random(6),
        ]);

        // Marketplace listings
        MarketplaceListing::create([
            'watch_id' => $watches[2]->id,
            'seller_id' => $user->id,
            'title' => 'Audemars Piguet Royal Oak 15500ST Blue',
            'description' => 'Lightly worn Royal Oak in superb condition.',
            'price' => 45000,
            'status' => 'active',
            'negotiable' => true,
            'slug' => 'ap-royal-oak-15500-' . Str::random(6),
        ]);

        MarketplaceListing::create([
            'watch_id' => $watches[3]->id,
            'seller_id' => $admin->id,
            'title' => 'A. Lange & Söhne Lange 1 White Gold',
            'description' => 'Superb German horology, perfect condition.',
            'price' => 28000,
            'status' => 'active',
            'negotiable' => false,
            'slug' => 'lange-sohne-lange-1-wg-' . Str::random(6),
        ]);

        // Valuations
        Valuation::create([
            'watch_id' => $watches[0]->id,
            'admin_id' => $admin->id,
            'estimated_value' => 15000,
            'low_estimate' => 13000,
            'high_estimate' => 17000,
            'notes' => 'Current market strong for SS Submariner.',
            'valuation_date' => today(),
        ]);
    }
}

