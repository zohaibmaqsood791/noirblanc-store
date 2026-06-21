<?php
/**
 * Simple WordPress Attribution Setup - Metabox version
 * This is more reliable than trying to add columns
 */

// Save attribution when order is created
add_action('woocommerce_new_order', function($order_id, $order) {
  global $wpdb;
  $logs_table = $wpdb->prefix . 'debug_logs';

  $customer_email = $order->get_billing_email();

  // Find the last attribution_captured log for this email
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
      update_post_meta($order_id, '_order_attribution_source', sanitize_text_field($data['source']));
      if (!empty($data['medium'])) {
        update_post_meta($order_id, '_order_attribution_medium', sanitize_text_field($data['medium']));
      }
      if (!empty($data['campaign'])) {
        update_post_meta($order_id, '_order_attribution_campaign', sanitize_text_field($data['campaign']));
      }
    }
  }
}, 10, 2);

// Add metabox to order details page
add_action('add_meta_boxes', function() {
  add_meta_box(
    'order_attribution_metabox',
    'Traffic Attribution',
    'render_attribution_metabox',
    'shop_order',
    'side',
    'default'
  );
});

// Render the metabox
function render_attribution_metabox($post) {
  $order_id = $post->ID;
  $source = get_post_meta($order_id, '_order_attribution_source', true);
  $medium = get_post_meta($order_id, '_order_attribution_medium', true);
  $campaign = get_post_meta($order_id, '_order_attribution_campaign', true);

  if ($source) {
    echo '<div style="padding: 10px; background: #f5f5f5; border-radius: 3px;">';
    echo '<p><strong>Source:</strong> ' . esc_html($source) . '</p>';
    if ($medium) {
      echo '<p><strong>Medium:</strong> ' . esc_html($medium) . '</p>';
    }
    if ($campaign) {
      echo '<p><strong>Campaign:</strong> ' . esc_html($campaign) . '</p>';
    }
    echo '</div>';
  } else {
    echo '<p style="color: #999;">No attribution data found.</p>';
  }
}
