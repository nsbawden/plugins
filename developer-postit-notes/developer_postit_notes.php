<?php
/*
Plugin Name: Developer Postit Notes
Plugin URI: http://webcaster.playnexus.com/dpn
Description: Allowing developers and editors to put postit notes directly onto pages and posts.
Version: 1.0
Author: Nathan S. Bawden
Author URI: http://webcaster.playnexus.com
*/

//*********** for install/uninstall actions (optional) ********************//
register_activation_hook(__FILE__,'developer_postit_notes_install');
register_deactivation_hook(__FILE__, 'developer_postit_notes_uninstall');
function developer_postit_notes_install(){
     developer_postit_notes_uninstall();//force to uninstall option
     add_option("developer_postit_notes_secret", rand(1000000, 100000000));
}

function developer_postit_notes_uninstall(){
    if(get_option('developer_postit_notes_secret')){
     delete_option("developer_postit_notes_secret");
     }
}
//*********** end of install/uninstall actions (optional) ********************//


//add_action('admin_menu', 'developer_postit_notes_menu');
//add_action('admin_menu', 'developer_postit_notes_menu');

if (is_admin()) {
	//developer_postit_notes_options_page();
	require_once("plugin-options.php");
} else {
	require_once("admin-page-class/get-options.php");
	load_plugin_options('developer_postit_notes_options', 'DeveloperPostitNotesOptions');
}


function developer_postit_unique_url(){
  	if (!current_user_can('manage_options'))  {
		wp_die( __('You do not have sufficient permissions to access this page.') );
	}
	echo '<div class="wrap">';
    echo '<h2>This is the Sub Menu</h2>';
	echo '<p>Include PHP file for better readability of your code.</p>';
	echo '</div>';

}

function developer_postit_unique_url2(){
  	if (!current_user_can('manage_options'))  {
		wp_die( __('You do not have sufficient permissions to access this page.') );
	}
	echo '<div class="wrap">';
    echo '<h2>This is the Second Sub Menu</h2>';
	echo '<p>Include PHP file for better readability of your code.</p>';
	echo '</div>';

}

function is_noter() {
 
    $user = wp_get_current_user();
 
    if ( empty( $user ) )
		return false;
 
    return in_array( 'administrator', (array) $user->roles ) || in_array( 'editor', (array) $user->roles );
}

function developer_postit_note($args = array(), $content = null) {
	global $dpnovr, $pn_priority;
	if (!is_noter())
		return '';
		
	extract(shortcode_atts(array(
		'top' => 0,
		'left' => 0,
		'float' => false,
		'p' => 0,
		'text' => 'note text missing'
	), $args ) );
	
	$pn_priority = $p;
	
	if ($dpnovr) {
		$top = $dpnovr['top'];
		$left = $dpnovr['left'];
		$float = $dpnovr['float'];
	}
	
	if (empty($content)) $content = $text;
	
	return developer_postit_note_tag($top, $left, $float, $p, $content);
}

function developer_postit_note_tag($top, $left, $float, $p, $content) {
	global $pnote_count, $pri_count;

	$pnote_count++;
	
	$ot = '';
	
	if (is_admin()) {
		$pt = '';
		if ($p == 0) {
			$pt .= "<span class='priority' style='width:30px;color:blue;display:inline-block;'>&nbsp;</span>";
		}
		else {
			$c = 'color:#7A7AFF';
			if ($p == 1) {
				$pri_count++;
				$c = 'color:#0EAF00';
			}
			$pt .= "<span class='priority' style='width:30px;$c;display:inline-block;'>[p$p]</span>";
		}
		$ot .= "<div style='background: #FFD;margin: 5px 8px 5px 5px;padding: 4px 10px'>$pt $content</div>";
	}
	else {
		if ($float)
			$position = "absolute";
		else
			$position = "relative";
			
		$ot .= "<div class='note' style='top:$top" . "px;left:$left" . "px'><img class='note-pin' src='/wp-content/plugins/developer-postit-notes/images/push-pin-red.png'><div style='position:$position'>$content</div></div>";
	}
	return $ot;
}

function developer_postit_notes_output() {
	global $wpdb, $dpnovr, $pn_priority;

	$dpnovr = array(
		'top' => 0,
		'left' => 0,
		'p' => 0,
		'float' => false
	);
	$output='';
	
	$query = "select * from wp_posts where post_content like \"%[note%]%\" and post_status = \"publish\"";
	
	$posts = $wpdb->get_results($query);
	$regex = '#(\[\s*?note\b[^\]]*\].*?\[/note\b[^\]]*\])#si';
	
	$files = array('header.php', 'page.php', 'sidebar.php', 'sidebar-main.php', 'footer.php', 'single-books.php', 'single.php', 'content.php');
	
	class PostClass {
		public function __construct(Array $properties=array()){
		  foreach($properties as $key => $value){
			$this->{$key} = $value;
		  }
		}
	  }
	 
	if ($posts) {
		global $pnote_count, $pri_count;
		$pnote_count = 0;
		$pri_count = 0;
		$cnt = 0;
		
		foreach ($files as $file) {
			$content = file_get_contents(get_template_directory() . "/$file");
			$posts[] = new PostClass(array("ID" => 9999999, "post_content" => $content, "post_title" => $file));
		}
		
		$output.='<ul class="posit-notes">';
		
		foreach ($posts as $post) {
			$cnt++;
			$output.='<li>';
			//$image=get_field('cover_image',$post -> ID);
			//$booklink=get_field('post_name',$post -> ID);
			//echo '$booklink'.$booklink;	
			//print_r($posts);

			//if(!empty($image)) $output.= '<div class="image"><a target="_blank" href="'.$booklink.'"><img src="'.$image['sizes']['large'].'"/></a></div>';
			//if(get_field('message',$post -> ID)) $output.= '<span class="message">' . get_field('message',$post -> ID) . '</span>';
			//$output.=get_field('post_content',$post -> ID);
			
			preg_match_all($regex, $post->post_content, $matches);
			
			if (!$matches || count($matches[1]) < 1) continue;
			
			$count = count($matches[1]);
			
			if ($post->ID != 9999999) {
				$link = get_permalink($post->ID);
				$output.= "<h3><a target='_blank' href='$link'>" . $post->post_title . " ($count)</a>&nbsp;&nbsp;<a style='font-size:70%' target='_blank' href='/wp-admin/post.php?post=$post->ID&action=edit'>[ edit ]</a></h3>";
			}
			else {
				$output .= "<h3>" . $post->post_title . " (" . $count . ")</h3>";
			}
			
			foreach ($matches[1] as $regs)
			{
				//$output .= "<xmp>$regs</xmp>";
				$output .= do_shortcode($regs);
			}
			
			$output.='</li>';
		}
		$output .= '</ul>';
		$top = "<h3>Active Notes: $pnote_count <span style='color:#0EAF00;font-size:80%;font-weight:normal'>($pri_count are priority 1)</span></h3>";
		$top .= "<span style='color:#0EAF00;'>p1</span> = do before launch";
		$top .= "<span style='color:#7A7AFF;'>,&nbsp;&nbsp;p2-9</span> = do after launch in order&nbsp&nbsp";
		$output =  $top . $output;
		
	}
	wp_reset_postdata();
	$dpnovr = null;
	return $output;
}

class Dpn_Shortcode {
	static $add_script;

	static function init() {
		add_shortcode('note', array(__CLASS__, 'handle_shortcode'));
		//add_action( 'wp_enqueue_scripts', array(__CLASS__, 'register_script' ));


		//add_action('init', array(__CLASS__, 'register_script'));
		add_action('wp_footer', array(__CLASS__, 'print_script'));
	}

	static function handle_shortcode($atts, $content) {
		self::$add_script = true;

		return developer_postit_note($atts, $content);
	}

	// static function register_script() {
	// 	wp_register_script('MscorlibJs', plugins_url('scripts/mscorlib.js', __FILE__), array('jquery'), '7.40', true);
	// 	wp_enqueue_script('AnnieFinchJs', plugins_url('scripts/AnnieFinch.js', __FILE__), array('MscorlibJs'), '1.0', true);
	// }

	static function print_script() {
		if ( ! self::$add_script )
			return;

		//wp_print_scripts('MscorlibJs');
		//wp_print_scripts('AnnieFinchJs');
	}
}

Dpn_Shortcode::init();



function dpn_css() {
	$ot = <<<EOT
<style>
div.note {
	position: relative;
	display: inline-block;
	transform:rotate(7deg);
	-ms-transform:rotate(7deg); /* IE 9 */
	-webkit-transform:rotate(7deg); /* Safari and Chrome */
	z-index: 99999;
	float: right;
}

div.note > div {
	width: 180px;
	display: inline-block;
	padding: 0 5px;
	background: url(/wp-content/plugins/developer-postit-notes/images/post-it-note-yellow.png) no-repeat;
	background-size: 100% 100%;
	padding: 35px 14px 14px 14px;
	font-size: 11pt;
	font-family: Neutra2Text-Book, "Source Sans Pro", sans-serif;
	line-height: 15pt;
	text-transform: none;
	color: #505039;
}
div.note img.note-pin {
	position: absolute;
	margin: 0;
	top: -9px;
	left: 65px;
	padding: 0;
	border: none;
	box-shadow: none;
	-webkit-box-shadow: none;
	background: transparent;
	z-index: 1;
}
</style>
EOT;
	echo $ot;
}
add_action( 'wp_head', 'dpn_css' );
