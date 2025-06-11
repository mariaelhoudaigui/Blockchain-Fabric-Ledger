'use strict';

const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        const ccpPath = path.resolve(__dirname, 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
        const ca = new FabricCAServices(caInfo.url);

        const walletPath = path.join(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        const userIdentity = await wallet.get('maria');
        if (userIdentity) {
            console.log('ilham2 identity already exists in the wallet');
            return;
        }

        const adminIdentity = await wallet.get('admin');
        if (!adminIdentity) {
            console.log('Admin identity not found in wallet. Enroll admin first.');
            return;
        }

        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, 'admin');

        await ca.register({
            affiliation: 'org1.department1',
            enrollmentID: 'maria',
            enrollmentSecret: 'mariapw',
            role: 'client'
        }, adminUser);

        const enrollment = await ca.enroll({
            enrollmentID: 'maria',
            enrollmentSecret: 'mariapw'
        });


        const identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };

        await wallet.put('maria', identity);
        console.log('✅ Successfully registered and enrolled maria');

    } catch (error) {
        console.error(`❌ Failed to register user: ${error}`);
        process.exit(1);
    }
}

main();