<?php
/**
 * Judge.me → WooCommerce Review Importer
 *
 * SETUP:
 *   1. Upload this file to your WordPress root (public_html/) via SFTP / Kinsta file manager
 *   2. Upload the Judge.me CSV to WordPress root and name it: judgeme-reviews.csv
 *   3. Visit: https://noirandblancnyc.kinsta.cloud/import-reviews.php?secret=nb_import_2026
 *   4. Wait for the page to finish (may take a few minutes for image downloads)
 *   5. DELETE both files from the server when done
 *
 * WHAT IT DOES:
 *   - Skips power-ball and kelly-2-pcs-set reviews
 *   - Skips reviews for products not found in WooCommerce
 *   - Deduplicates by product + email + body
 *   - Downloads review images and attaches them to the comment
 *   - Stores rating as WooCommerce comment meta
 *   - Does NOT re-import reviews already imported (safe to re-run)
 */

define('SECRET', 'nb_import_2026e');
define('CSV_FILE', __DIR__ . '/judgeme-reviews.csv');
define('SKIP_HANDLES', ['kelly-2-pcs-set-top-handle-bag', 'power-ball', '']);
define('BATCH_LIMIT', 2000); // max reviews per run

// ── Auth ────────────────────────────────────────────────────────────────────
if (($_GET['secret'] ?? '') !== SECRET) {
    http_response_code(403);
    die('Forbidden');
}

if (!file_exists(CSV_FILE)) {
    die('CSV file not found at: ' . CSV_FILE);
}

// ── Bootstrap WordPress ──────────────────────────────────────────────────────
require_once __DIR__ . '/wp-load.php';

// ── DEDUP MODE: remove cross-product duplicate reviews ────────────────────────
// Visit: import-reviews.php?secret=nb_import_2026e&mode=dedup
// A duplicate = same author_email + first 120 chars of body on MORE THAN ONE product.
// Keeps the lowest comment_ID (first imported), deletes the rest.
if (($_GET['mode'] ?? '') === 'dedup') {
    header('Content-Type: text/plain; charset=utf-8');
    global $wpdb;

    $rows = $wpdb->get_results(
        "SELECT comment_ID, comment_post_ID, comment_author_email,
                LEFT(TRIM(comment_content), 120) AS body_start
         FROM {$wpdb->comments}
         WHERE comment_type = 'review' AND comment_approved = '1'
         ORDER BY comment_ID ASC",
        ARRAY_A
    );

    // Group by email + body_start
    $groups = [];
    foreach ($rows as $r) {
        $key = $r['comment_author_email'] . '|||' . $r['body_start'];
        $groups[$key][] = (int) $r['comment_ID'];
    }

    $deleted = 0;
    foreach ($groups as $key => $ids) {
        if (count($ids) <= 1) continue;
        // Keep first (lowest ID), delete the rest
        $keep = $ids[0];
        $dupes = array_slice($ids, 1);
        foreach ($dupes as $dupe_id) {
            // Delete comment meta first
            $wpdb->delete($wpdb->commentmeta, ['comment_id' => $dupe_id]);
            // Delete comment
            wp_delete_comment($dupe_id, true);
            echo "Deleted duplicate #{$dupe_id} (kept #{$keep})\n";
            $deleted++;
        }
    }

    // Update rating caches for all products
    $products = $wpdb->get_col("SELECT ID FROM {$wpdb->posts} WHERE post_type='product' AND post_status='publish'");
    foreach ($products as $pid) {
        WC_Comments::clear_transients((int)$pid);
    }

    echo "\nDone. Deleted {$deleted} duplicate reviews.\n";
    exit;
}

// ── SYNC MODE: update review_image_urls to use WP attachment URLs ─────────────
// Visit: import-reviews.php?secret=nb_import_2026e&mode=sync
if (($_GET['mode'] ?? '') === 'sync') {
    header('Content-Type: text/plain; charset=utf-8');
    global $wpdb;

    $rows = $wpdb->get_results(
        "SELECT cm.comment_id, cm.meta_value AS attach_ids
         FROM {$wpdb->commentmeta} cm
         WHERE cm.meta_key = 'review_images'",
        ARRAY_A
    );

    echo "Reviews with WP attachments: " . count($rows) . "\n\n";
    $updated = 0;

    foreach ($rows as $row) {
        $comment_id = (int) $row['comment_id'];
        $wp_urls = [];
        foreach (explode(',', $row['attach_ids']) as $aid) {
            $url = wp_get_attachment_url(intval($aid));
            if ($url) $wp_urls[] = $url;
        }
        if (empty($wp_urls)) continue;
        update_comment_meta($comment_id, 'review_image_urls', implode(',', $wp_urls));
        $updated++;
    }

    echo "Updated review_image_urls to WP URLs: {$updated}\n";
    exit;
}

// ── PATCH MODE: download review images into WordPress media library ────────────
// Visit: import-reviews.php?secret=nb_import_2026e&mode=patch
if (($_GET['mode'] ?? '') === 'patch') {
    set_time_limit(0);
    header('Content-Type: text/plain; charset=utf-8');

    require_once ABSPATH . 'wp-admin/includes/media.php';
    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/image.php';

    global $wpdb;

    // Load all reviews that have review_image_urls but no WP attachment yet
    $meta_rows = $wpdb->get_results(
        "SELECT cm.comment_id, cm.meta_value AS image_urls
         FROM {$wpdb->commentmeta} cm
         WHERE cm.meta_key = 'review_image_urls'
         AND cm.comment_id NOT IN (
             SELECT comment_id FROM {$wpdb->commentmeta} WHERE meta_key = 'review_images'
         )",
        ARRAY_A
    );

    echo "Reviews needing image download: " . count($meta_rows) . "\n\n";

    $total_downloaded = 0;
    $total_failed = 0;

    // Get a product ID to attach media to (use first product as parent)
    $any_product = $wpdb->get_var("SELECT ID FROM {$wpdb->posts} WHERE post_type='product' AND post_status='publish' LIMIT 1");

    foreach ($meta_rows as $meta) {
        $comment_id = (int) $meta['comment_id'];
        $urls = array_filter(array_map('trim', explode(',', $meta['image_urls'])));
        $attach_ids = [];
        $wp_urls = [];

        foreach ($urls as $url) {
            // Download with browser User-Agent to bypass CDN blocks
            $response = wp_remote_get($url, [
                'timeout'    => 30,
                'user-agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
                'sslverify'  => false,
            ]);

            if (is_wp_error($response) || wp_remote_retrieve_response_code($response) !== 200) {
                echo "  FAIL download: {$url}\n";
                $total_failed++;
                continue;
            }

            // Write to temp file
            $tmp = wp_tempnam();
            file_put_contents($tmp, wp_remote_retrieve_body($response));

            $filename = basename(parse_url($url, PHP_URL_PATH));
            if (!preg_match('/\.(jpe?g|png|webp|gif)$/i', $filename)) {
                $filename .= '.jpg';
            }

            $file = [
                'name'     => $filename,
                'type'     => 'image/jpeg',
                'tmp_name' => $tmp,
                'error'    => 0,
                'size'     => filesize($tmp),
            ];

            $attach_id = media_handle_sideload($file, (int) $any_product);
            @unlink($tmp);

            if (is_wp_error($attach_id)) {
                echo "  FAIL sideload: {$url} — " . $attach_id->get_error_message() . "\n";
                $total_failed++;
                continue;
            }

            $attach_ids[] = $attach_id;
            $wp_urls[]    = wp_get_attachment_url($attach_id);
            $total_downloaded++;
        }

        if (!empty($attach_ids)) {
            update_comment_meta($comment_id, 'review_images', implode(',', $attach_ids));
            // Replace external URLs with WordPress URLs
            update_comment_meta($comment_id, 'review_image_urls', implode(',', $wp_urls));
            echo "OK #{$comment_id} — " . count($attach_ids) . " image(s) saved to WP\n";
        }
    }

    echo "\nDone.\nDownloaded: {$total_downloaded} | Failed: {$total_failed}\n";
    exit;
}

if (!function_exists('wc_get_product')) {
    die('WooCommerce is not active.');
}

set_time_limit(0);
ini_set('memory_limit', '256M');

// ── Helpers ──────────────────────────────────────────────────────────────────

// Manual handle → WooCommerce slug overrides
const HANDLE_MAP = [
    'noir-blanc-leather-crossbody-bag-and-accessories' => 'luma-crossbody-bag-ivory',
    'noir-blanc-leather-crossbody-bag-1'               => 'luma-crossbody-bag-noir',
    'ava-crossbody-bag-blue-lagoon'                    => 'luma-crossbody-bag-blue-lagoon',
    'ava-crossbody-bag-noir'                           => 'luma-crossbody-bag-blue-lagoon',
];

function nb_find_product_id(string $handle): int {
    static $cache = [];
    if (isset($cache[$handle])) return $cache[$handle];

    // Apply manual overrides first
    $lookup = HANDLE_MAP[$handle] ?? $handle;

    // Try exact slug match via get_page_by_path
    $post = get_page_by_path($lookup, OBJECT, 'product');
    if ($post) {
        $cache[$handle] = $post->ID;
        return $post->ID;
    }

    // Fallback: direct WP_Query by post_name (catches variable products & edge cases)
    $q = new WP_Query([
        'post_type'      => ['product', 'product_variation'],
        'name'           => $lookup,
        'posts_per_page' => 1,
        'post_status'    => ['publish', 'private', 'draft'],
        'fields'         => 'ids',
    ]);
    if (!empty($q->posts)) {
        $id = (int) $q->posts[0];
        // If it's a variation, use the parent product
        $parent = wp_get_post_parent_id($id);
        $id = $parent ?: $id;
        $cache[$handle] = $id;
        return $id;
    }

    // Try stripping last segment (color suffix)
    $parts = explode('-', $lookup);
    if (count($parts) > 3) {
        $base = implode('-', array_slice($parts, 0, -1));
        $q2 = new WP_Query([
            'post_type'      => 'product',
            'name'           => $base,
            'posts_per_page' => 1,
            'post_status'    => ['publish', 'private', 'draft'],
            'fields'         => 'ids',
        ]);
        if (!empty($q2->posts)) {
            $cache[$handle] = (int) $q2->posts[0];
            return $cache[$handle];
        }
    }

    $cache[$handle] = 0;
    return 0;
}

function nb_review_exists(int $product_id, string $email, string $body_start): bool {
    $comments = get_comments([
        'post_id'      => $product_id,
        'author_email' => $email,
        'type'         => 'review',
        'number'       => 10,
    ]);
    foreach ($comments as $c) {
        if (strpos($c->comment_content, $body_start) === 0) return true;
    }
    return false;
}

function nb_download_image(string $url, int $post_id): int {
    if (empty(trim($url))) return 0;

    // Require WP media functions
    require_once ABSPATH . 'wp-admin/includes/media.php';
    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/image.php';

    $tmp = download_url($url, 30);
    if (is_wp_error($tmp)) return 0;

    $filename = basename(parse_url($url, PHP_URL_PATH));
    if (empty(pathinfo($filename, PATHINFO_EXTENSION))) {
        $filename .= '.jpg';
    }

    $file = [
        'name'     => $filename,
        'type'     => 'image/jpeg',
        'tmp_name' => $tmp,
        'error'    => 0,
        'size'     => filesize($tmp),
    ];

    $attach_id = media_handle_sideload($file, $post_id);
    @unlink($tmp);

    return is_wp_error($attach_id) ? 0 : $attach_id;
}

// ── Parse CSV ────────────────────────────────────────────────────────────────
$handle = fopen(CSV_FILE, 'r');
$headers = fgetcsv($handle);
$rows = [];
$seen = [];

while (($row = fgetcsv($handle)) !== false) {
    if (count($row) !== count($headers)) continue;
    $r = array_combine($headers, $row);

    if (in_array($r['product_handle'], SKIP_HANDLES, true)) continue;
    if (empty(trim($r['body']))) continue;

    // Deduplicate
    $key = $r['product_handle'] . '|' . $r['reviewer_email'] . '|' . substr(trim($r['body']), 0, 80);
    if (isset($seen[$key])) continue;
    $seen[$key] = true;

    $rows[] = $r;
    if (count($rows) >= BATCH_LIMIT) break;
}
fclose($handle);

// ── Import ───────────────────────────────────────────────────────────────────
$stats = [
    'total'         => count($rows),
    'imported'      => 0,
    'skipped_no_product' => 0,
    'skipped_duplicate'  => 0,
    'images_attached'    => 0,
    'errors'        => [],
];

header('Content-Type: text/html; charset=utf-8');
echo '<pre style="font-family:monospace;font-size:13px;padding:20px">';
echo "Judge.me → WooCommerce Import\n";
echo "Total reviews to process: {$stats['total']}\n";
echo str_repeat('─', 60) . "\n\n";
flush();

foreach ($rows as $i => $r) {
    $handle_slug = $r['product_handle'];
    $product_id  = nb_find_product_id($handle_slug);

    if (!$product_id) {
        $stats['skipped_no_product']++;
        echo "  SKIP (no product): {$handle_slug}\n";
        flush();
        continue;
    }

    $body      = trim($r['body']);
    $body_start = substr($body, 0, 80);
    $email     = $r['reviewer_email'] ?: 'anonymous@review.import';

    if (nb_review_exists($product_id, $email, $body_start)) {
        $stats['skipped_duplicate']++;
        continue;
    }

    // Parse date
    $date_raw = $r['review_date'] ?? '';
    $date_gmt = '';
    if ($date_raw) {
        $ts       = strtotime($date_raw);
        $date_gmt = $ts ? gmdate('Y-m-d H:i:s', $ts) : '';
    }
    if (!$date_gmt) $date_gmt = current_time('mysql', true);
    $date_local = get_date_from_gmt($date_gmt);

    $rating = max(1, min(5, intval($r['rating'] ?? 5)));
    $name   = trim($r['reviewer_name']) ?: 'Customer';
    $title  = trim($r['title'] ?? '');

    $comment_id = wp_insert_comment([
        'comment_post_ID'      => $product_id,
        'comment_author'       => $name,
        'comment_author_email' => $email,
        'comment_content'      => $body,
        'comment_date'         => $date_local,
        'comment_date_gmt'     => $date_gmt,
        'comment_approved'     => 1,
        'comment_type'         => 'review',
        'comment_parent'       => 0,
        'user_id'              => 0,
    ]);

    if (!$comment_id || is_wp_error($comment_id)) {
        $stats['errors'][] = "Failed inserting review for {$handle_slug}";
        continue;
    }

    // Rating meta (WooCommerce standard)
    add_comment_meta($comment_id, 'rating', $rating, true);

    // Title meta
    if ($title) {
        add_comment_meta($comment_id, 'title', $title, true);
    }

    // Update product rating cache
    WC_Comments::clear_transients($product_id);

    // ── Images ──────────────────────────────────────────────────────────────
    $image_urls = array_values(array_filter(array_map('trim', explode(',', $r['picture_urls'] ?? ''))));

    // Always store original URLs — used as primary source in the reviews API
    if (!empty($image_urls)) {
        add_comment_meta($comment_id, 'review_image_urls', implode(',', $image_urls), true);
        $stats['images_attached'] += count($image_urls);
    }

    $stats['imported']++;
    $img_note = !empty($attach_ids) ? ' [' . count($attach_ids) . ' img]' : '';
    echo "  ✓ [{$rating}★] {$name} → {$handle_slug}{$img_note}\n";
    flush();
}

// ── Update all product rating caches ────────────────────────────────────────
echo "\nUpdating product rating caches...\n";
$products = wc_get_products(['limit' => -1, 'return' => 'ids']);
foreach ($products as $pid) {
    WC_Comments::clear_transients($pid);
}

// ── Summary ──────────────────────────────────────────────────────────────────
echo "\n" . str_repeat('─', 60) . "\n";
echo "DONE\n\n";
echo "Imported:            {$stats['imported']}\n";
echo "Images attached:     {$stats['images_attached']}\n";
echo "Skipped (no product): {$stats['skipped_no_product']}\n";
echo "Skipped (duplicate): {$stats['skipped_duplicate']}\n";

if (!empty($stats['errors'])) {
    echo "\nErrors:\n";
    foreach ($stats['errors'] as $e) echo "  - {$e}\n";
}

echo "\n⚠️  DELETE import-reviews.php and judgeme-reviews.csv from the server now.\n";
echo '</pre>';
