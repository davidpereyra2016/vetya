<?php
$recipient = 'vetyaoficial@gmail.com';
$public_email = 'contacto@vetya.com.ar';
$redirect_base = '/';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ' . $redirect_base);
    exit;
}

function clean_input($value) {
    return trim(str_replace(array("\r", "\n"), ' ', strip_tags($value ?? '')));
}

$honeypot = clean_input($_POST['website'] ?? '');
if ($honeypot !== '') {
    header('Location: ' . $redirect_base . '?mensaje=enviado#contacto');
    exit;
}

$name = clean_input($_POST['name'] ?? '');
$email = filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$message = trim(strip_tags($_POST['message'] ?? ''));

if ($name === '' || !$email || $message === '') {
    header('Location: ' . $redirect_base . '?mensaje=error#contacto');
    exit;
}

$subject = 'Nuevo mensaje desde vetya.com.ar';
$body = "Nombre: {$name}\n";
$body .= "Email: {$email}\n\n";
$body .= "Mensaje:\n{$message}\n";

$headers = array(
    'From: VetYa <' . $public_email . '>',
    'Reply-To: ' . $name . ' <' . $email . '>',
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: PHP/' . phpversion(),
);

$sent = mail($recipient, $subject, $body, implode("\r\n", $headers));

header('Location: ' . $redirect_base . ($sent ? '?mensaje=enviado#contacto' : '?mensaje=error#contacto'));
exit;
?>
