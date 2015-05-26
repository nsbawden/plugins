<?php
// create custom plugin settings menu
add_action('admin_menu', 'eyesfollow_create_menu');

function eyesfollow_create_menu() {

	//create new top-level menu
	add_menu_page('WP Eyes Follow Plugin Settings', 'Eyes Follow Settings', 'administrator', __FILE__, 'eyesfollow_settings_page',plugins_url('/images/icon.png', __FILE__));

	//call register settings function
	add_action( 'admin_init', 'register_mysettings' );
}


function register_mysettings() {
	//register our settings
	register_setting( 'eyesfollow-settings-group', 'new_option_name' );
	register_setting( 'eyesfollow-settings-group', 'some_other_option' );
	register_setting( 'eyesfollow-settings-group', 'option_etc' );
}

function eyesfollow_settings_page() {
?>
<div class="wrap">
<h2>Your Plugin Name</h2>

<form method="post" action="options.php">
    <?php settings_fields( 'eyesfollow-settings-group' ); ?>
    <?php /*do_settings( 'eyesfollow-settings-group' );*/ ?>
    <table class="form-table">
        <tr valign="top">
        <th scope="row">New Option Name</th>
        <td><input type="text" name="new_option_name" value="<?php echo get_option('new_option_name'); ?>" /></td>
        </tr>
         
        <tr valign="top">
        <th scope="row">Some Other Option</th>
        <td><input type="text" name="some_other_option" value="<?php echo get_option('some_other_option'); ?>" /></td>
        </tr>
        
        <tr valign="top">
        <th scope="row">Options, Etc.</th>
        <td><input type="text" name="option_etc" value="<?php echo get_option('option_etc'); ?>" /></td>
        </tr>
    </table>
    
    <?php submit_button(); ?>

</form>
</div>
<?php } ?>