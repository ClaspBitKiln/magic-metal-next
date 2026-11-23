<?php
declare(strict_types=1);

const MM_MAX_REQUEST_SIZE = 4500000;
const MM_MAX_FILES_SIZE = 4194304;
const MM_EXTENSIONS = ['xlsx','xls','pdf','doc','docx','png','jpg','jpeg','webp','dwg','dxf','mp3','m4a','wav','ogg','webm'];

function mm_text(array $form, string $key, int $max = 4000): string {
    $value = $form[$key] ?? '';
    if (!is_scalar($value)) return '';
    $value = trim((string)$value);
    // Match JS character limits without requiring mbstring on shared hosting.
    return preg_match('/^.{0,' . $max . '}/us', $value, $match) ? $match[0] : '';
}
function mm_error(int $status, string $message): array { return ['status'=>$status,'json'=>['error'=>$message]]; }
function mm_valid_contact(string $phone, string $email): bool {
    $digits = preg_replace('/\D/', '', $phone);
    return (bool)($phone || $email)
        && (!$phone || (preg_match('/^\+?[\d\s().-]+$/D', $phone) && strlen($digits) >= 7 && strlen($digits) <= 15))
        && (!$email || preg_match('/^[^\s@]+@[^\s@]+\.[^\s@]+$/uD', $email));
}
function mm_random_token(string $token): bool {
    $token = trim($token);
    if (!preg_match('/^[A-Za-z]{12,}$/D', $token)) return false;
    $changes = 0;
    for ($i=1; $i<strlen($token); $i++) if (ctype_upper($token[$i]) !== ctype_upper($token[$i-1])) $changes++;
    return $changes >= 6;
}
function mm_spam_reason(array $fields, bool $hasFiles): ?string {
    $m = trim($fields['message']);
    if (preg_match('/\b(?:backlinks?|link\s+building)\b/i',$m)
        && preg_match('/\b(?:seo|wordpress)\b/i',$m)
        && preg_match('/\b(?:audit|discount|promo(?:tion|code)?|coupon)\b|\b\d{1,2}\s*%\s*off\b/i',$m)
        && preg_match('/\bunsubscribe\b/i',$m)
        && preg_match('~https?://[^\s<>]+|\b(?:tiny\.cc|bit\.ly|tinyurl\.com)/[^\s<>]+~i',$m)) return 'seo-advertising';
    $context = array_filter([$fields['name'],$fields['company'],$fields['context'],$fields['productDirection']],fn($s)=>trim($s)!=='');
    return !$hasFiles && !$context && mm_random_token($m) && mm_random_token($fields['delivery']) ? 'random-request-fields' : null;
}
function mm_safe_filename(string $name): string {
    if (class_exists('Normalizer')) $name = Normalizer::normalize($name, Normalizer::FORM_KC) ?: $name;
    $name = preg_replace('/[\\\\\/:*?"<>|\x00-\x1f]/u', '_', $name) ?? 'attachment';
    $name = preg_replace('/\.{2,}/', '.', $name);
    $chars = preg_split('//u', $name, -1, PREG_SPLIT_NO_EMPTY);
    return $chars ? implode('',array_slice($chars,-180)) : 'attachment';
}
function mm_file_signature(string $b, string $ext): bool {
    return match ($ext) {
        'pdf' => str_starts_with($b, '%PDF-'),
        'png' => str_starts_with($b, "\x89PNG\r\n\x1a\n"),
        'jpg','jpeg' => str_starts_with($b, "\xff\xd8\xff"),
        'webp' => substr($b,0,4)==='RIFF' && substr($b,8,4)==='WEBP',
        'docx','xlsx' => str_starts_with($b,'PK'),
        'doc','xls' => str_starts_with($b,"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1"),
        'dwg' => str_starts_with($b,'AC10'),
        'dxf' => str_starts_with(ltrim(preg_replace('/^\xEF\xBB\xBF/', '',substr($b,0,1024))),"0\nSECTION") || str_starts_with(ltrim(preg_replace('/^\xEF\xBB\xBF/','',substr($b,0,1024))),"0\r\nSECTION"),
        'mp3' => str_starts_with($b,'ID3') || (strlen($b)>1 && ord($b[0])===255 && (ord($b[1])&224)===224),
        'm4a' => substr($b,4,4)==='ftyp',
        'wav' => substr($b,0,4)==='RIFF' && substr($b,8,4)==='WAVE',
        'ogg' => str_starts_with($b,'OggS'),
        'webm' => str_starts_with($b,"\x1a\x45\xdf\xa3"),
        default => false,
    };
}
/** Pure validation: files are normalized records, buffers checked before any mail or storage. */
function mm_validate(array $form, array $files, int $contentLength, ?int $nowMs = null): array {
    if ($contentLength > MM_MAX_REQUEST_SIZE) return mm_error(413,'Запрос превышает допустимый размер');
    if (mm_text($form,'website',200)) return ['status'=>200,'json'=>['ok'=>true],'honeypot'=>true];
    if (!in_array($form['consent']??null,['on','true','1'],true)) return mm_error(400,'Подтвердите согласие на обработку персональных данных.');
    $started = mm_text($form,'startedAt',20);
    if (($started==='' || is_numeric($started)) && ($nowMs??(int)(microtime(true)*1000)) - (float)$started < 1800) return mm_error(400,'Проверка формы не пройдена');
    $fields = [];
    foreach (['name'=>120,'company'=>180,'phone'=>80,'email'=>180,'message'=>8000,'delivery'=>240,'context'=>300,'productDirection'=>80,'landingPage'=>1000,'utm_source'=>200,'utm_medium'=>200,'utm_campaign'=>200,'referrer'=>1000] as $key=>$max) $fields[$key]=mm_text($form,$key,$max);
    if (!$fields['phone'] && !$fields['email']) return mm_error(400,'Укажите телефон или email');
    if (!mm_valid_contact($fields['phone'],$fields['email'])) return mm_error(400,'Проверьте телефон или email: укажите действительный способ связи.');
    $files = array_values(array_filter($files,fn($file)=>(int)($file['size']??0)>0));
    if (!$fields['message'] && !$files) return mm_error(400,'Прикрепите заявку или опишите задачу');
    $spam = mm_spam_reason($fields,!!$files);
    if ($spam) return mm_error(400,$spam==='seo-advertising'?'Форма предназначена для заявок на продукцию. Рекламные предложения через неё не принимаются.':'Опишите нужную продукцию или прикрепите спецификацию.');
    if (array_sum(array_column($files,'size')) > MM_MAX_FILES_SIZE) return mm_error(413,'Файлы превышают 4 МБ. Отправьте большие файлы на m1@magicmet.ru.');
    foreach ($files as &$file) {
        $ext = strtolower(pathinfo($file['name'],PATHINFO_EXTENSION));
        if (!in_array($ext,MM_EXTENSIONS,true)) return mm_error(415,'Недопустимый тип файла');
        $file['filename'] = mm_safe_filename($file['name']);
        if (!mm_file_signature($file['buffer'],$ext)) return mm_error(415,'Содержимое файла «'.$file['filename'].'» не соответствует его формату');
    }
    unset($file);
    return ['status'=>200,'fields'=>$fields,'files'=>$files];
}
/** Persistent per-IP limit, atomic across workers. Never trust client-supplied X-Forwarded-For. */
function mm_rate_limited(string $dir, string $secret, string $ip, ?int $now = null): bool {
    if (strlen($secret)<32) throw new RuntimeException('Rate-limit secret missing');
    if (!is_dir($dir) && !mkdir($dir,0700,true) && !is_dir($dir)) throw new RuntimeException('Rate-limit directory unavailable');
    $file = $dir.'/'.hash_hmac('sha256',$ip,$secret).'.json';
    $h = fopen($file,'c+');
    if (!$h || !flock($h,LOCK_EX)) throw new RuntimeException('Rate-limit lock unavailable');
    try {
        chmod($file,0600);
        $now = $now??time();
        $previous = json_decode(stream_get_contents($h),true)??[];
        $recent = array_values(array_filter($previous,fn($time)=>is_int($time) && $now-$time<900));
        $blocked = count($recent)>=5;
        if (!$blocked) $recent[]=$now;
        rewind($h);ftruncate($h,0);fwrite($h,json_encode($recent));fflush($h);
        return $blocked;
    } finally {flock($h,LOCK_UN);fclose($h);}
}
function mm_delivery_failure(bool $hasFiles, string $reason): array {
    $r = mm_error(503,$hasFiles
        ? 'Не удалось подтвердить отправку прикреплённых файлов менеджеру. Заявка могла сохраниться. Уточните получение по телефону или отправьте файлы на m1@magicmet.ru.'
        : 'Не удалось подтвердить доставку заявки менеджеру. Она могла сохраниться. Уточните получение по телефону или напишите на m1@magicmet.ru.');
    $r['json']['deliveryFailure']=$reason;
    return $r;
}
