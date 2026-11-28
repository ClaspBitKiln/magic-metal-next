<?php
declare(strict_types=1);
// Public file: deploy as public_html/api/request.php. Code/config/vendor stay outside public_html.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
function respond(array $response): never {
    http_response_code($response['status']);
    echo json_encode($response['json'],JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}
if (($_SERVER['REQUEST_METHOD']??'') !== 'POST') {header('Allow: POST');respond(['status'=>405,'json'=>['error'=>'Метод не поддерживается']]);}
if ((int)($_SERVER['CONTENT_LENGTH']??0)>4500000) respond(['status'=>413,'json'=>['error'=>'Запрос превышает допустимый размер']]);
$privateRoot = dirname(__DIR__,2).'/magicmet-private';
$configPath = getenv('MAGICMET_REQUEST_CONFIG') ?: $privateRoot.'/request-config.php';
$configReal = realpath($configPath);
$docRoot = realpath($_SERVER['DOCUMENT_ROOT']??dirname(__DIR__));
// Refuse secrets under the web root, even if an override was accidentally configured.
if (!$configReal || ($docRoot && ($configReal===$docRoot || str_starts_with($configReal,$docRoot.DIRECTORY_SEPARATOR)))) {
    respond(['status'=>503,'json'=>['error'=>'Не удалось подтвердить доставку заявки менеджеру. Она могла сохраниться. Уточните получение по телефону или напишите на m1@magicmet.ru.','deliveryFailure'=>'smtp-not-configured']]);
}
$privateRoot=dirname($configReal);
try {
    $config = require $configReal;
    require $privateRoot.'/request-lib.php';
    $origin = $_SERVER['HTTP_ORIGIN']??'';
    if ($origin!=='' && !in_array($origin,$config['ALLOWED_ORIGINS']??['https://magicmet.ru','https://www.magicmet.ru'],true)) respond(mm_error(403,'Недопустимый источник запроса'));
    if (mm_rate_limited($config['RATE_LIMIT_DIR']??$privateRoot.'/request-rate',$config['RATE_LIMIT_SECRET']??'',$_SERVER['REMOTE_ADDR']??'local')) respond(mm_error(429,'Слишком много запросов'));
    $files = [];
    $upload=$_FILES['files']??null;
    if ($upload) {
        $names=is_array($upload['name'])?$upload['name']:[$upload['name']];
        // PHP truncates uploads at its configured count; reject saturation instead of losing files.
        $uploadLimit=(int)ini_get('max_file_uploads');
        if ($uploadLimit<2 || count($names)>=$uploadLimit) respond(mm_error(413,'Слишком много файлов. Объедините спецификацию в один PDF или отправьте файлы на m1@magicmet.ru.'));
        $total=0;
        foreach ($names as $i=>$name) {
            $array=is_array($upload['name']);
            $get=fn($key)=>$array?($upload[$key][$i]??null):($upload[$key]??null);
            $error=(int)$get('error');
            if ($error===UPLOAD_ERR_NO_FILE) continue;
            if (in_array($error,[UPLOAD_ERR_INI_SIZE,UPLOAD_ERR_FORM_SIZE],true)) respond(mm_error(413,'Файлы превышают 4 МБ. Отправьте большие файлы на m1@magicmet.ru.'));
            if ($error!==UPLOAD_ERR_OK) respond(mm_error(400,'Не удалось прочитать форму. Проверьте файлы и повторите отправку.'));
            $size=(int)$get('size');$total+=$size;
            if ($total>MM_MAX_FILES_SIZE) respond(mm_error(413,'Файлы превышают 4 МБ. Отправьте большие файлы на m1@magicmet.ru.'));
            $tmp=$get('tmp_name');
            if (!is_string($tmp)||!is_uploaded_file($tmp)) respond(mm_error(400,'Не удалось прочитать форму. Проверьте файлы и повторите отправку.'));
            $buffer=file_get_contents($tmp);
            if ($buffer===false || strlen($buffer)!==$size) respond(mm_error(400,'Не удалось прочитать форму. Проверьте файлы и повторите отправку.'));
            $files[]=['name'=>(string)$name,'size'=>$size,'buffer'=>$buffer,'type'=>(string)$get('type')];
        }
    }
    $result=mm_validate($_POST,$files,(int)($_SERVER['CONTENT_LENGTH']??0));
    if (isset($result['json'])) respond($result);
    $fields=$result['fields'];$files=$result['files'];
    if (empty($config['SMTP_HOST']) || empty($config['SMTP_USER']) || empty($config['SMTP_PASSWORD'])) respond(mm_delivery_failure(!!$files,'smtp-not-configured'));
    if (!is_file($privateRoot.'/vendor/autoload.php')) throw new RuntimeException('SMTP library unavailable');
    require $privateRoot.'/vendor/autoload.php';
    $mail = new PHPMailer\PHPMailer\PHPMailer(true);
    $mail->isSMTP();
    $mail->SMTPDebug=0;
    $mail->Host=$config['SMTP_HOST'];
    $mail->Port=(int)($config['SMTP_PORT']??587);
    $mail->SMTPSecure=($config['SMTP_SECURE']??false)===true?PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS:PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
    $mail->SMTPAuth=true;$mail->Username=$config['SMTP_USER'];$mail->Password=$config['SMTP_PASSWORD'];
    $mail->Timeout=20;$mail->Timelimit=25;
    $mail->CharSet='UTF-8';$mail->Encoding='base64';
    $mail->setFrom($config['SMTP_USER']);
    $mail->addAddress($config['REQUEST_TO_EMAIL']??'m1@magicmet.ru');
    if ($fields['email']) $mail->addReplyTo($fields['email']);
    $subject=$fields['company']?:($fields['name']?:($fields['phone']?:$fields['email']));
    $mail->Subject='Заявка с сайта: '.str_replace(["\r","\n"],' ',$subject);
    $message=$fields['message']?:'Требования приложены в файлах.';
    if ($fields['delivery']) $message.="\n\nПолучение: ".$fields['delivery'];
    $source=$fields['utm_source']?:($fields['referrer']?'referral':'direct');
    $html='<h2>Новая заявка с сайта</h2>';
    foreach (['Имя'=>$fields['name']?:'—','Компания'=>$fields['company']?:'—','Телефон'=>$fields['phone']?:'—','Email'=>$fields['email']?:'—','Получение'=>$fields['delivery']?:'не указано','Направление'=>$fields['productDirection']?:'не выбрано','Контекст'=>$fields['context']?:'не указан','Запрос'=>$message,'Источник'=>$source,'Страница'=>$fields['landingPage'],'UTM medium'=>$fields['utm_medium'],'UTM campaign'=>$fields['utm_campaign']] as $label=>$value) $html.='<p><b>'.$label.':</b><br>'.nl2br(htmlspecialchars($value,ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8')).'</p>';
    $mail->isHTML(true);$mail->Body=$html;$mail->AltBody=strip_tags(str_replace('<br>',"\n",$html));
    foreach ($files as $file) $mail->addStringAttachment($file['buffer'],$file['filename'],'base64','application/octet-stream');
    $mail->send();
    respond(['status'=>200,'json'=>['ok'=>true,'id'=>null,'emailDelivered'=>true,'crmDelivered'=>false]]);
} catch (Throwable $e) {
    // Never log submitted personal data, attachment contents, SMTP auth strings or raw exceptions.
    error_log('MagicMet request delivery failed ('.get_class($e).')');
    $reason='smtp-error';
    if (isset($mail)) {
        $error=$mail->getSMTPInstance()->getError();
        $code=(string)($error['smtp_code']??'');
        if ($code==='535' || $code==='534') $reason='smtp-auth';
        elseif (!empty($error['error']) && stripos((string)$error['error'],'connect')!==false) $reason='smtp-connection';
    }
    $hasFiles=isset($files)&&count($files)>0;
    if (function_exists('mm_delivery_failure')) respond(mm_delivery_failure($hasFiles,$reason));
    respond(['status'=>503,'json'=>['error'=>'Не удалось подтвердить доставку заявки менеджеру. Она могла сохраниться. Уточните получение по телефону или напишите на m1@magicmet.ru.','deliveryFailure'=>$reason]]);
}
