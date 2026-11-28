"""Native PHP8.1 multipart smoke; local Docker only, never sends mail."""
import json, pathlib, shutil, subprocess, tempfile, time, urllib.request, urllib.error
src = pathlib.Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory(prefix='magicmet-php-http-') as tmp:
    root=pathlib.Path(tmp); (root/'public/api').mkdir(parents=True); (root/'private').mkdir()
    shutil.copy(src/'request.php',root/'public/api/request.php'); shutil.copy(src/'request-lib.php',root/'private/request-lib.php')
    (root/'private/request-config.php').write_text("<?php return ['RATE_LIMIT_SECRET'=>'"+'a'*32+"','RATE_LIMIT_DIR'=>'/app/private/rate'];")
    cid=subprocess.check_output(['docker','run','--rm','--user','1000:1000','-d','-p','127.0.0.1:18981:8080','-e','MAGICMET_REQUEST_CONFIG=/app/private/request-config.php','-v',str(root)+':/app','php:8.1-cli-alpine','php','-d','display_errors=0','-d','log_errors=1','-d','max_file_uploads=100','-S','0.0.0.0:8080','-t','/app/public'],text=True).strip()
    def request(fields, files=()):
        shutil.rmtree(root/'private/rate',ignore_errors=True)
        boundary='MagicMetMultipartBoundary'
        chunks=[]
        for key,value in fields.items():chunks.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{key}"\r\n\r\n{value}\r\n'.encode())
        for name,body in files:chunks.append(f'--{boundary}\r\nContent-Disposition: form-data; name="files[]"; filename="{name}"\r\nContent-Type: application/octet-stream\r\n\r\n'.encode()+body+b'\r\n')
        data=b''.join(chunks)+f'--{boundary}--\r\n'.encode()
        req=urllib.request.Request('http://127.0.0.1:18981/api/request.php',data=data,headers={'Content-Type':'multipart/form-data; boundary='+boundary})
        try:r=urllib.request.urlopen(req)
        except urllib.error.HTTPError as error:r=error
        return r.status,json.load(r)
    try:
        for _ in range(40):
            try:urllib.request.urlopen('http://127.0.0.1:18981/api/request.php')
            except urllib.error.HTTPError:break
            except OSError:time.sleep(.1)
        base={'consent':'on','startedAt':'1','phone':'+79227117363','message':'Труба 57х4 ст20'}
        assert request({**base,'consent':''})[0]==400
        # First bad file must be checked even when a later file is valid.
        assert request(base,[('first.pdf',b'fake'),('second.pdf',b'%PDF-1.7')])[0]==415
        status,body=request(base,[('first.pdf',b'%PDF-1.7'),('second.pdf',b'%PDF-1.7')])
        assert status==503 and body['deliveryFailure']=='smtp-not-configured' and 'прикреплённых' in body['error']
        assert request(base,[('f.pdf',b'%PDF-1.7')]*100)[0]==413
        assert request(base,[('f.pdf',b'%PDF-1.7')]*101)[0]==413
        assert request(base,[('large.pdf',b'%PDF-'+b'x'*4194304)])[0]==413
        print('PASS 6 native multipart HTTP checks; no mail sent')
    finally:subprocess.run(['docker','stop',cid],stdout=subprocess.DEVNULL,check=True)
