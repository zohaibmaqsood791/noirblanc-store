<?php
/**
 * WordPress Order Attribution Setup
 * Add this code to your WordPress site (noirblanc.store)
 *
 * Same options as WORDPRESS_DEBUG_LOGS_SETUP.php:
 * - Add to wp-content/mu-plugins/
 * - Add to functions.php
 * - Create as a plugin
 */

// Add attribution column to wp_debug_logs table
function add_attribution_column() {
  global $wpdb;
  $table_name = $wpdb->prefix . 'debug_logs';

  // Check if column exists
  $columns = $wpdb->get_results("DESCRIBE $table_name");
  $column_names = wp_list_pluck($columns, 'Field');

  if (!in_array('attribution', $column_names)) {
    $wpdb->query("ALTER TABLE $table_name ADD COLUMN attribution varchar(255) AFTER store");
  }
}
add_attribution_column();

// Add custom column to WooCommerce orders for attribution
add_filter('manage_shop_order_posts_columns', function($columns) {
  $columns['order_attribution'] = 'Traffic Source';
  return $columns;
});

// Display attribution in order list
add_action('manage_shop_order_posts_custom_column', function($column, $post_id) {
  if ($column === 'order_attribution') {
    $attribution = get_post_meta($post_id, '_order_attribution', true);
    $medium = get_post_meta($post_id, '_order_attribution_medium', true);
    $campaign = get_post_meta($post_id, '_order_attribution_campaign', true);

    if ($attribution) {
      echo '<strong>' . esc_html($attribution) . '</strong>';
      if ($medium) {
        echo '<br><small>' . esc_html($medium) . '</small>';
      }
      if ($campaign) {
        echo '<br><small style="color: #999;">Campaign: ' . esc_html($campaign) . '</small>';
      }
    } else {
      echo '<span style="color: #999;">-</span>';
    }
  }
}, 10, 2);

// Store attribution on order creation (via REST API)
add_action('rest_insert_shop_order', function($post, $request) {
  $params = $request->get_json_params();
  $attribution = $params['meta']['attribution'] ?? null;

  if ($attribution) {
    update_post_meta($post->ID, '_order_attribution', sanitize_text_field($attribution['source'] ?? 'direct'));
    update_post_meta($post->ID, '_order_attribution_medium', sanitize_text_field($attribution['medium'] ?? ''));
    update_post_meta($post->ID, '_order_attribution_campaign', sanitize_text_field($attribution['campaign'] ?? ''));
  }
}, 10, 2);

// Hook into checkout completion to save attribution from debug logs
add_action('woocommerce_order_status_changed', function($order_id) {
  global $wpdb;
  $logs_table = $wpdb->prefix . 'debug_logs';

  $order = wc_get_order($order_id);
  if (!$order) return;

  $customer_email = $order->get_billing_email();

  // Find the last "email_entered" log for this customer
  $log = $wpdb->get_row($wpdb->prepare(
    "SELECT data FROM $logs_table
     WHERE event = 'email_entered'
     AND email = %s
     ORDER BY timestamp DESC
     LIMIT 1",
    $customer_email
  ));

  if ($log) {
    $data = json_decode($log->data, true);
    if (!empty($data['attribution'])) {
      update_post_meta($order_id, '_order_attribution', sanitize_text_field($data['attribution']));
    }
  }
});

// Display attribution in WooCommerce order details (admin)
add_action('woocommerce_admin_order_data_after_billing_address', function($order) {
  $attribution = get_post_meta($order->get_id(), '_order_attribution', true);
  $medium = get_post_meta($order->get_id(), '_order_attribution_medium', true);
  $campaign = get_post_meta($order->get_id(), '_order_attribution_campaign', true);

  if ($attribution) {
    echo '<h3 style="margin-top: 20px;">Traffic Attribution</h3>';
    echo '<p>';
    echo '<strong>Source:</strong> ' . esc_html($attribution) . '<br>';
    if ($medium) {
      echo '<strong>Medium:</strong> ' . esc_html($medium) . '<br>';
    }
    if ($campaign) {
      echo '<strong>Campaign:</strong> ' . esc_html($campaign);
    }
    echo '</p>';
  }
});

// Export attribution in order REST API
add_filter('woocommerce_rest_prepare_shop_order_object', function($response, $post, $request) {
  $order_id = $post->get_id();
  $attribution = get_post_meta($order_id, '_order_attribution', true);

  if ($attribution) {
    $response->data['meta']['attribution'] = array(
      'source' => get_post_meta($order_id, '_order_attribution', true),
      'medium' => get_post_meta($order_id, '_order_attribution_medium', true),
      'campaign' => get_post_meta($order_id, '_order_attribution_campaign', true),
    );
  }

  return $response;
}, 10, 3);
