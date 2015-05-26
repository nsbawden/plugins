<?php

//
// documentation: https://en.bainternet.info/my-options-panel/#
//

require_once("admin-page-class/admin-page-class.php");

//
// Class override to create customized admin menu structure
//

class NSB_Admin_Page_Class extends BF_Admin_Page_Class {

    public function AddMenuTopPage () {
		$default = array(
			'capability' => 'edit_themes',
			'menu_title' => '',
			'id'         => 'id',
			'icon_url'   => '',
			'position'   => null
		);
		
		$this->args = array_merge($default, $this->args);

		add_menu_page('Postit Notes', 'Postit Notes', 'manage_options', 'developer_postit_notes', 'developer_postit_notes_display');
	    $page = add_submenu_page( 'developer_postit_notes', 'Options', 'options', 'manage_options', 'developer_postit_notes_options_page', array($this, 'DisplayPage'));

		if ($page){
			$this->_Slug = $page;
			// Adds my_help_tab when my_admin_page loads
			add_action('load-'.$page, array($this,'Load_page_hooker'));
		}
    }
}

function developer_postit_notes_display() {
	if (!current_user_can('manage_options'))  {
		wp_die( __('You do not have sufficient permissions to access this page.') );
	}
	echo '<div class="wrap">';
    echo '<h2>Notes</h2>';
    //include('table.php');
	include('dashboard.php');
	echo '</div>';
}

/**
* configure your admin page
*/
$config = array(    
'menu'           => array('top' => 'Postit Notes'),             //sub page to Postit Notes page
'page_title'     => __('Developer Postit Notes','dpin'),       //The name of this page 
'capability'     => 'manage_options',         // The capability needed to view the page 
'option_group'   => 'developer_postit_notes_options',       //the name of the option to create in the database
'id'             => 'admin_dpin',            // meta box id, unique per page
'fields'         => array(),            // list of fields (can be added by field arrays)
'local_images'   => false,          // Use local or hosted images (meta box images for add/remove)
'use_with_theme' => false          //change path if used with theme set to true, false for a plugin or anything else for a custom path(default false).
);

/**
* instantiate your admin page
*/

//$options_panel = new BF_Admin_Page_Class($config);
$options_panel = new NSB_Admin_Page_Class($config);
$options_panel->OpenTabs_container('');

/**
* define your admin page tabs listing
*/
$options_panel->TabsListing(array(
	'links' => array(
	  'general' =>  __('General','dpin'),
	)
));

$options_panel->OpenTab('general');
$options_panel->Title(__("General Options","dpin"));

$options_panel->addText('xoxo', array('name'=> __('xoxo','dpin'), 'std'=> 'huh?', 'desc' => __('','dpin')));

$options_panel->CloseTab();
