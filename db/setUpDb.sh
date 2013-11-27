echo "---------------------------"
echo "SQLite Install"
echo "---------------------------"
sudo apt-get install sqlite3

echo "---------------------------"
echo "Creation of the Database"
echo "---------------------------"
DIR=$(cd $(dirname "$0"); pwd) 
sqlite3 brightnest.db < $DIR/createTables.sql

echo "Done! brightnest DB is ready."
