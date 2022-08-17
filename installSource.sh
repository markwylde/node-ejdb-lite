LATEST_SOFTMOTIONS_HEAD=3d297578a0b2b30c115f64f4f925a2da0614a004
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
