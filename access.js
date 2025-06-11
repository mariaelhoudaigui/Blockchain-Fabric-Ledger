'use strict';

const { Contract } = require('fabric-contract-api');

class AccessContract extends Contract {

    // Initialisation du ledger (optionnel)
    async initLedger(ctx) {
        console.info('Ledger initialisé');
    }

    // Enregistrer une action d'accès (write, modify, delete)
    async recordAccess(ctx, user, action, resource) {
        const timestamp = new Date(ctx.stub.getTxTimestamp().seconds.low * 1000).toISOString();

        const accessRecord = {
            user,
            action,
            resource,
            timestamp,
            docType: 'accessRecord'
        };

        // La clé est générée automatiquement avec un préfixe et l'horodatage
        const key = `ACCESS_${ctx.stub.getTxID()}`;

        await ctx.stub.putState(key, Buffer.from(JSON.stringify(accessRecord)));

        console.info(`Action ${action} enregistrée pour ${resource} par ${user} à ${timestamp}`);
        return accessRecord;
    }

    // Récupérer un enregistrement par sa clé
    async getAccessRecord(ctx, key) {
        const recordJSON = await ctx.stub.getState(key);
        if (!recordJSON || recordJSON.length === 0) {
            throw new Error(`Le document ${key} n'existe pas`);
        }
        return recordJSON.toString();
    }

    // Récupérer tous les accès enregistrés
    async getAllAccessRecords(ctx) {
        const allResults = [];
        const iterator = await ctx.stub.getStateByRange('', '');

        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                const Key = res.value.key;
                const Record = JSON.parse(res.value.value.toString('utf8'));

                if (Record.docType === 'accessRecord') {
                    allResults.push({ Key, Record });
                }
            }

            if (res.done) {
                await iterator.close();
                return JSON.stringify(allResults, null, 2);
            }
        }
    }
}

module.exports = AccessContract;
