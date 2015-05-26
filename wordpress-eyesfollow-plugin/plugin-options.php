<?php

//
// documentation: https://en.bainternet.info/my-options-panel/#
//

require_once("admin-page-class/admin-page-class.php");

/**
* configure your admin page
*/
$config = array(    
'menu'           => 'settings',             //sub page to settings page
'page_title'     => __('WP Eyes Follow','wpef'),       //The name of this page 
'capability'     => 'edit_themes',         // The capability needed to view the page 
'option_group'   => 'wpef_options',       //the name of the option to create in the database
'id'             => 'admin_page',            // meta box id, unique per page
'fields'         => array(),            // list of fields (can be added by field arrays)
'local_images'   => false,          // Use local or hosted images (meta box images for add/remove)
'use_with_theme' => false          //change path if used with theme set to true, false for a plugin or anything else for a custom path(default false).
);  

/**
* instantiate your admin page
*/
$options_panel = new BF_Admin_Page_Class($config);
$options_panel->OpenTabs_container('');

/**
* define your admin page tabs listing
*/
$options_panel->TabsListing(array(
	'links' => array(
	  'mouse_stopped' =>  __('Mouse stopped','wpef'),
	)
));

$options_panel->OpenTab('mouse_stopped');
$options_panel->Title(__("Mouse Stop Options","wpef"));

//$options_panel->addCheckbox('hideOnStop',array('name'=> __('Hide eyes when mouse stopped','wpef'), 'std' => false, 'desc' => __('','wpef')));

$options_panel->addRadio(
	'homeAction',
	array(
		'hide'=> __('hide eyes', 'wpef'),
		'element'=> __('move to page element', 'wpef')),
	array(
		'name'=> __('Mouse stopped action','wpef'),
		'std'=> array('homeAction1'),
		//'desc' => __('Simple radio field description','apc')
		));

$options_panel->addText('homeSelector', array('name'=> __('element jQuery selector','wpef'), 'std'=> '', 'desc' => __('jQuery selector for element eyes will go to when mouse is not moving. Leave blank for default action.','wpef')));

$options_panel->addText('stopWait', array('name'=> __('wait time after mouse stop in ms','wpef'), 'std'=> '5000', 'desc' => __('','wpef')));

$options_panel->CloseTab();
