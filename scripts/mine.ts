import {Address, TonClient} from '@ton/ton';
import { unixNow } from '../lib/utils';
import { MineMessageParams, Queries } from '../wrappers/NftGiver';
import { toNano } from '@ton/ton';
import { NetworkProvider } from '@ton/blueprint';

const walletAddress = Address.parse('UQD252e-3SBONyc6DFDhVzXHtbQ7fqieU-uGJZuShOow4zku');
const collectionAddress = Address.parse('EQDk8N7xM5D669LC2YACrseBJtDyFqwtSPCNhRWXU7kjEptX');


async function mine () {
    const endpoint = 'https://toncenter.com/api/v2/jsonRPC';
    const client = new TonClient({endpoint});

    const miningData = await client.runMethod(collectionAddress, 'get_mining_data');
    const {stack} = miningData;

    const complexity = stack.readBigNumber();
    const lastSuccess = stack.readBigNumber();
    const seed = stack.readBigNumber();
    const targetDelta = stack.readBigNumber();
    const minCpl = stack.readBigNumber();
    const maxCpl = stack.readBigNumber();

    const mineParams: MineMessageParams = {
        expire: unixNow() + 300,
        mintTo: walletAddress,
        data1: 0n,
        seed
    };

    let msg = Queries.mine(mineParams);

    const bufferToBigint = (buffer: Buffer) => BigInt('0x' + buffer.toString('hex'));

    while (bufferToBigint(msg.hash()) > complexity) {
        mineParams.expire = unixNow() + 300;
        mineParams.data1 += 1n;
        msg = Queries.mine(mineParams);
    }
    console.log('Yoo-hoo, you found something!');
    return msg;
}

export async function run(provider: NetworkProvider) {
    const msg = await mine();

    await provider.sender().send({
        to: collectionAddress,
        value: toNano(0.05),
        body: msg
    });
}

mine();

