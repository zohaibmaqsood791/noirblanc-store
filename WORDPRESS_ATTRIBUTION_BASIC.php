<?php
/**
 * Basic Attribution - Guaranteed to work
 * Displays attribution in order details (after billing address)
 */

// Save attribution when order is created
add_action('woocommerce_new_order', function($order_id, $order) {
  global $wpdb;
  $logs_table = $wpdb->prefix . 'debug_logs';
  $customer_email = $order->get_billing_email();

  $log = $wpdb->get_row($wpdb->prepare(
    "SELECT data FROM $logs_table
     WHERE event = 'attribution_captured'
     AND email = %s
     ORDER BY timestamp DESC
     LIMIT 1",
    $customer_email
  ));

  if ($log && $log->data) {
    $data = json_decode($log->data, true);
    if (!empty($data['source'])) {
      update_post_meta($order_id, '_order_attribution_source', $data['source']);
      if (!empty($data['medium'])) {
        update_post_meta($order_id, '_order_attribution_medium', $data['medium']);
      }
      if (!empty($data['campaign'])) {
        update_post_meta($order_id, '_order_attribution_campaign', $data['campaign']);
      }
    }
  }
}, 10, 2);

// Display in order details
add_action('woocommerce_admin_order_data_after_billing_address', function($order) {
  $source = get_post_meta($order->get_id(), '_order_attribution_source', true);
  $medium = get_post_meta($order->get_id(), '_order_attribution_medium', true);
  $campaign = get_post_meta($order->get_id(), '_order_attribution_campaign', true);

  if ($source) {
    echo '<h3 style="margin-top: 20px; border-top: 1px solid #ddd; padding-top: 12px;">Traffic Attribution</h3>';
    echo '<p><strong>Source:</strong> ' . esc_html($source) . '</p>';
    if ($medium) echo '<p><strong>Medium:</strong> ' . esc_html($medium) . '</p>';
    if ($campaign) echo '<p><strong>Campaign:</strong> ' . esc_html($campaign) . '</p>';
  }
});

// Add column to orders list
add_filter('manage_edit-shop_order_columns', function($columns) {
  $columns['attribution'] = 'Traffic Source';
  return $columns;
}, 20);

add_action('manage_shop_order_posts_custom_column', function($column, $post_id) {
  if ($column === 'attribution') {
    $source = get_post_meta($post_id, '_order_attribution_source', true);
    if ($source) {
      echo '<strong>' . esc_html($source) . '</strong>';
      $medium = get_post_meta($post_id, '_order_attribution_medium', true);
      if ($medium) {
        echo '<br><small>' . esc_html($medium) . '</small>';
      }
    } else {
      echo '-';
    }
  }
}, 10, 2);
