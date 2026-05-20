#!/bin/bash
export PATH="/opt/homebrew/bin:/usr/local/mysql/bin:$PATH"

echo "Iniciando EcoRecicla..."

if ! mysqladmin ping -u root -p'eco2024' --silent 2>/dev/null; then
  echo "MySQL no está corriendo. Inicia MySQL desde Preferencias del Sistema."
  exit 1
fi
echo "MySQL conectado"
echo "PHP $(php -v | head -1 | cut -d' ' -f2)"
echo ""
echo "  http://localhost:8000"
echo "  Admin: admin / eco2024"
echo ""

php -S localhost:8000 "$(dirname "$0")/router.php"
