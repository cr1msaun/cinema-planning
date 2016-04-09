<?
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_before.php");

if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest')
{
    require('./functions.php');

	if ($_REQUEST['action'] == 'saveShowtimes')
	{
		$data = json_decode($_POST['data']);

		saveShowtimes($data);
	}
}