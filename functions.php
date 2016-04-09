<?
CModule::IncludeModule('iblock');
$selected_date = $_GET['date'] ? $_GET['date'] : date('Y.m.d');

// по месяцу в обе стороны
function getDates() {
	$dates = [];

	for ($i = 0; $i < 31; $i++) {
		array_push($dates, date('Y.m.d', strtotime('+' . $i . 'days')));
	}

	for ($i = 1; $i < 30; $i++) {
		array_unshift($dates, date('Y.m.d', strtotime('-' . $i . 'days')));
	}

	return $dates;
}

function getScheduleHours() {
	$hours = [];
	$startHour = 5;

	for ($startHour; $startHour <= 28; $startHour++) {
		if ($startHour >= 24) 
			$hour = $startHour - 24;
		else
			$hour = $startHour;

		$hours[] = $hour . ':00';
	}

	return $hours;
}

function getMovies() {
	$movies = [];

	$moviesRes = CIBlockElement::GetList(
		array('ID' => 'DESC'),
		array(
			'IBLOCK_ID' => MOVIES_IBLOCK_ID,
			'ACTIVE' => 'Y',
			'>DATE_CREATE' => ConvertTimeStamp(strtotime('-62 days'), "FULL")
		),
		false,
		false,
		array('ID', 'NAME', 'PROPERTY_PLANNING_DURATION')
	);

	while ($movie = $moviesRes->GetNext())
		$movies[] = $movie;

	return $movies;
}

function getHalls() {
	$halls = [];

	$hallsRes = CIBlockElement::GetList(
		array('ID' => 'ASC'),
		array(
			'IBLOCK_ID' => 6,
			'ACTIVE' => 'Y'
		)	
	);

	while ($hall = $hallsRes->GetNext())
		$halls[] = $hall;

	return $halls;
}

function getShowtimes($date, $hallId) {
	$showtimes = [];

	$showtimesRes = CIBlockElement::GetProperty(6, $hallId, array(), array("CODE" => "SHOWTIMES"));

    while ($showtime = $showtimesRes->GetNext())
    {	
    	$showtimeDate = date('Y.m.d', strtotime($showtime['VALUE']));
    	
    	if ($showtimeDate != $date) continue;

    	list($name, $duration, $break, $format) = explode('//', $showtime['DESCRIPTION']);

    	$start_time = date('H:i', strtotime($showtime['VALUE']));
    	$end_time = date('H:i', strtotime($showtime['VALUE'] . ' +' . $duration . 'minutes'));

        $showtimes[] = array('NAME' => $name, 'START_TIME' => $start_time, 'END_TIME' => $end_time, 'DURATION' => $duration, 'BREAK' => $break, 'FORMAT' => $format);
    }

    return $showtimes;
}

function saveShowtimes($data) {
    if (!$data) return;

    $hallsRes = CIBlockElement::GetList(
        array(),
        array('IBLOCK_ID' => 6)
    );

    while ($hall = $hallsRes->GetNext()) {
        $hallShowtimes = array();
        $showtimesRes = CIBlockElement::GetProperty(6, $hall['ID'], array(), array("CODE" => "SHOWTIMES"));

        while ($showtime = $showtimesRes->GetNext())
        {
            if (!$showtime['VALUE'] || $data->date == date('Y.m.d', strtotime($showtime['VALUE']))) continue;

            $hallShowtimes[$hall['ID']][] = array('VALUE' => $showtime['VALUE'], 'DESCRIPTION' => $showtime['DESCRIPTION']);
        }

        foreach ($data->halls as $id => $showtimes) {
            foreach ($showtimes as $showtime) {
                if ($hall['ID'] != $id) continue;

                $hallShowtimes[$hall['ID']][] = array(
                    'VALUE' => date('d.m.Y', strtotime(str_replace('.', '-', $data->date))) . ' ' . $showtime->time . ':00',
                    'DESCRIPTION' => $showtime->name . '//' . $showtime->duration . '//' . $showtime->break . '//' . $showtime->format
                );
            }

            usort($hallShowtimes[$hall['ID']], 'sortFunctionWithProperDateFormat');
        }

        CIBlockElement::SetPropertyValues($hall['ID'], 6, $hallShowtimes[$hall['ID']], 'showtimes');
    }

    // сохраняем длительность
    $movies = $data->movies;

    foreach ($movies as $movieId=>$movieDuration) {
        CIBlockElement::SetPropertyValues($movieId, MOVIES_IBLOCK_ID, $movieDuration, 'PLANNING_DURATION');
    }
}