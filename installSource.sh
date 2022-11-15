SOFTMOTIONS_BRANCH=bc370d1aab86d5e2b8b15cbd7f804d3bbc6db185
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
