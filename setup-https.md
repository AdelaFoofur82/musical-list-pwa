# Configurar HTTPS para desarrollo local

## Opción 1: Usar mkcert (Recomendado - Más fácil)

### Instalar mkcert
```powershell
# Con Chocolatey
choco install mkcert

# O descarga desde: https://github.com/FiloSottile/mkcert/releases
```

### Generar certificados
```powershell
# Crear CA local (solo una vez)
mkcert -install

# Crear directorio para certificados
mkdir D:\IONOSHiDrive\users\adela82\adela\certs

# Generar certificados para localhost y tu IP local
cd D:\IONOSHiDrive\users\adela82\adela\certs
mkcert localhost 127.0.0.1 192.168.0.21 dev.sambango.local ::1
```

Esto creará dos archivos:
- `localhost+4-key.pem` (renombrar a `localhost-key.pem`)
- `localhost+4.pem` (renombrar a `localhost.pem`)

### Renombrar archivos
```powershell
cd D:\IONOSHiDrive\users\adela82\adela\certs
ren localhost+4-key.pem localhost-key.pem
ren localhost+4.pem localhost.pem
```

## Opción 2: Usar dominio personalizado

### Añadir entrada en hosts
Editar `C:\Windows\System32\drivers\etc\hosts` (como administrador):
```
127.0.0.1 dev.sambango.local
192.168.0.21 dev.sambango.local
```

### Generar certificado para el dominio
```powershell
cd D:\IONOSHiDrive\users\adela82\adela\certs
mkcert dev.sambango.local
ren dev.sambango.local-key.pem localhost-key.pem
ren dev.sambango.local.pem localhost.pem
```

## Iniciar Vite
```powershell
npm run dev
```

Ahora podrás acceder a:
- `https://localhost:3000`
- `https://192.168.0.21:3000`
- `https://dev.sambango.local:3000` (si configuraste hosts)

## Acceder desde otros dispositivos
- Asegúrate de que el firewall de Windows permita conexiones en el puerto 3000
- Accede desde otro dispositivo usando: `https://192.168.0.21:3000`
- Acepta el certificado autofirmado en el navegador
