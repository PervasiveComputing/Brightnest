echo "================================="
echo "BRIGHTNEST"
echo "	Cozy Home Automation System..."
echo "================================="

echo ""
echo "- Note that this script will require admin's rights."
echo ""


DIR=$(cd $(dirname "$0"); pwd)
echo "---------------------------"
echo "DB INSTALL & CONFIG"
echo "---------------------------"
echo ""
sh $DIR/db/setUpDb.sh

echo ""
echo "---------------------------"
echo "WEBSERVER INSTALL & CONFIG"
echo "---------------------------"
echo ""
sudo apt-get update
sudo apt-get install -y python-software-properties python g++ make
sudo add-apt-repository -y ppa:chris-lea/node.js
sudo apt-get update
sudo apt-get install nodejs

echo ""
echo "---------------------------"
echo "DEVICES SERVER LAUNCHING"
echo "---------------------------"
echo "TO DO"

echo ""
echo "---------------------------"
echo "WEBSERVER LAUNCHING"
echo "---------------------------"
echo ""
node web/app
