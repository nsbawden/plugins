<?php

if (!function_exists('apc_add_options')) :

function apc_add_options() {
	global $apcOptionsKey, $apcJsKey;
	$opt = get_option($apcOptionsKey);
	$JSON = json_encode($opt);
	$ot = <<<EOT
<script type="text/javascript">
/* <![CDATA[ */
	window.$apcJsKey = $JSON;
/* ]]> */
</script>
EOT;
	echo $ot;
}

function load_plugin_options($options_key, $js_key) {
	global $apcOptionsKey, $apcJsKey;
	$apcOptionsKey = $options_key;
	$apcJsKey = $js_key;
	add_action( 'wp_head', 'apc_add_options' );
}

endif; // apc_add_options