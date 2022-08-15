LATEST_SOFTMOTIONS_HEAD=b71bf4faa542351dc809c43c5610d6aacd8b6dd7
rm -rf ejdb
git clone --depth=1 --recursive https://github.com/Softmotions/ejdb.git
cd ejdb
git fetch $LATEST_SOFTMOTIONS_HEAD
git checkout $LATEST_SOFTMOTIONS_HEAD
mkdir ./build
cd build
cmake .. -DBUILD_NODEJS_BINDING=ON -DCMAKE_BUILD_TYPE=Release
make
cd ../../
cp ./ejdb/build/src/bindings/ejdb2_node/ejdb2_node/*/ejdb2_node.node ./src/ejdb2_node.node
