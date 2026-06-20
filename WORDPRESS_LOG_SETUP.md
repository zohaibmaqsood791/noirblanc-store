# WordPress Debug Logs Setup

This sets up persistent logging for your headless checkout. Logs are saved to your WooCommerce WordPress site at **noirblanc.store**.

## What it does

- Logs all checkout events (email entered, checkout started, etc.)
- Stores in WordPress database for 7+ days
- Shows admin dashboard with:
  - All logs with timestamps
  - Email tracking
  - Event statistics
  - Unique user counts

## Setup Instructions

### Step 1: Add Code to WordPress

Go to your WordPress at **https://noirblanc.store/wp-admin/**

**Option A: Via Functions.php (Easiest)**
1. Go to Appearance → Theme File Editor
2. Find `functions.php`
3. Copy all code from `WORDPRESS_DEBUG_LOGS_SETUP.php`
4. Paste at the bottom of functions.php
5. Save

**Option B: Via Must-Use Plugin (Better)**
1. Via FTP/SFTP, connect to your server
2. Go to `/wp-content/mu-plugins/` (create folder if it doesn't exist)
3. Create file: `debug-logs.php`
4. Copy all code from `WORDPRESS_DEBUG_LOGS_SETUP.php`
5. Save

**Option C: As a Plugin**
1. Create a folder: `wp-content/plugins/headless-debug-logs/`
2. Copy code to `headless-debug-logs.php`
3. Add plugin header:
```php
<?php
/*
Plugin Name: Headless Debug Logs
Description: Log headless store checkout events
*/
```
4. Activate in WordPress Plugins menu

### Step 2: Verify It's Working

1. Go to WooCommerce → Debug Logs in WordPress admin
2. You should see a table (empty at first)
3. Log should say: "Logs from last 7 days"

### Step 3: Test It

1. Go to https://www.noirblancny.com/checkout
2. Add item to cart
3. Enter email address
4. Go back to WordPress → WooCommerce → Debug Logs
5. **You should see events appearing in the table!**

## What You'll See

**Example Log Entry:**
```
Time: 06-20 10:52:17
Event: email_entered
Email: customer@example.com
URL: /checkout
Data: {} (empty object)
```

**Stats Section Shows:**
- `email_entered`: 45 (45 customers entered email)
- `klIdentify_called`: 44 (44 identified to Klaviyo)
- `klTrack_started_checkout`: 42 (42 started checkout)
- `unique_emails`: 42 (unique customers)

## Monitor Your Flows

**Example Daily Workflow:**
1. Morning: Go to WordPress admin
2. Check WooCommerce → Debug Logs
3. See how many:
   - Customers reached checkout
   - Entered email
   - Started checkout in Klaviyo
   - Abandoned cart (for Klaviyo flow testing)

## Troubleshooting

**Logs not appearing?**
- Check WordPress is running: https://noirblanc.store/wp-admin
- Verify code was added to functions.php
- Check browser console for errors

**Can't find the menu?**
- Must be logged in as admin
- Look for: WooCommerce → Debug Logs (submenu)

**Need to clear old logs?**
Run this in WordPress → Tools → Database:
```sql
DELETE FROM wp_debug_logs WHERE timestamp < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

## Done!

You now have persistent logging across your headless store! 🎉

View logs anytime at: **WordPress Admin → WooCommerce → Debug Logs**
