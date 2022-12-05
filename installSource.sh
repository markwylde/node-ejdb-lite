SOFTMOTIONS_BRANCH=79b51947d1c30c2bdac65715bc2939db1443081b
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
