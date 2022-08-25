SOFTMOTIONS_BRANCH=15569d1cf11831898c61ed15074b89275fc7222f
rm -rf ejdb
git clone --depth=1 --recursive https://github.com/Softmotions/ejdb.git
cd ejdb
git checkout $SOFTMOTIONS_BRANCH
mkdir ./build
cd build
cmake .. -DBUILD_NODEJS_BINDING=ON -DCMAKE_BUILD_TYPE=Release
make
cd ../../
cp ./ejdb/build/src/bindings/ejdb2_node/ejdb2_node/*/ejdb2_node.node ./src/ejdb2_node.node
