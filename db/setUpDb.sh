echo "---------------------------"
echo "SQLite Install"
echo "---------------------------"
sudo apt-get install sqlite3

echo "---------------------------"
echo "Creation of the Database"
echo "---------------------------"
sqlite3 brightnest.db < createTables.sql
