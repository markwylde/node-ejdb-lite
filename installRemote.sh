version=$(node -p "require('./package.json').version")

(. /etc/os-release) || true
if [ `which apk` ]; then
  os=alpine
  nodedir=./src
elif [ "$(uname)" = "Linux" ]; then
  os=linux
  nodedir=./src
elif [[ "$OSTYPE" == "darwin"* ]]; then
  os=darwin
  nodedir=./src
else
  echo "Could not detect operating system"
  uname
  uname -a
  echo "Will attempt to build from source"
  npm install --ignore-scripts
  npm run install:source
  exit 0
fi

echo "Your OS is $os"

downloadUrl="https://github.com/markwylde/node-ejdb-lite/releases/download/v${version}/ejdb2_node_x64_${os}_16.x.node"
echo "Downloading $downloadUrl"
mkdir -p $nodedir
curl -L -o $nodedir/ejdb2_node.node $downloadUrl
