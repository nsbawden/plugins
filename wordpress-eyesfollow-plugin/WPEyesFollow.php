<?php

/*
 Plugin Name: Wordpress EyesFollow
 Plugin URI: www.playnexus.com/wp-plugins/eyesfollow
 Description: Add eyesfollow support to wordpress
 Version: 0.9.1
 Author: Nathan Bawden
 Author URI: www.playnexus.com/wp-plugins
 License: GPL2
 */

//

$myDebug = ".debug";
$myVersion = "v" . time();

if (is_admin()) {
	require_once("plugin-options.php");
} else {
	require_once("admin-page-class/get-options.php");
	load_plugin_options('wpef_options', 'WPEyesFollowOptions');
}

// Non-debug version
//wp_enqueue_script('NsbFull', "/wp-content/plugins/wordpress-eyesfollow-plugin/NsbFull.debug.js", array('jquery'));
//wp_enqueue_script('WPEyesFollow', "/wp-content/plugins/wordpress-eyesfollow-plugin/WPEyesFollow.plugin.debug.js", array('jquery','NsbFull'));

// Debug version
function eyesfollow_enqueue_scripts() {
	global $myVersion;
	wp_enqueue_script('NsbFull', "/wp-content/plugins/wordpress-eyesfollow-plugin/NsbFull.debug.js", array('jquery'), $myVersion);
	wp_enqueue_script('WPEyesFollow', "/wp-content/plugins/wordpress-eyesfollow-plugin/WPEyesFollow.plugin.debug.js", array('jquery','NsbFull'), $myVersion);
}
add_action( 'wp_enqueue_scripts', 'eyesfollow_enqueue_scripts' );

