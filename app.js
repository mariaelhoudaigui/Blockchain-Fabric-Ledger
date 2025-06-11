const express = require('express');
const cors = require('cors');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const ActiveDirectory = require('activedirectory');

const app = express();

app.use(cors());
app.use(express.json());

// === CONFIGURATION AD DS ===
const adConfig = {
    url: 'ldap://192.168.1.10',
    baseDN: 'dc=iis,dc=local',
    username: 'administrator@iis.local',
    password: 'Azerty123@' // Remplace par ton vrai mot de passe
};

const ad = new ActiveDirectory(adConfig);

// === Fonction de connexion au réseau Fabric ===
async function connectToNetwork() {
    try {
        const ccpPath = path.resolve(__dirname, 'connection-org1.json');
        const connectionProfile = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        const gateway = new Gateway();
        await gateway.connect(connectionProfile, {
            identity: 'maria',
            wallet,
            discovery: { enabled: true, asLocalhost: true }
        });

        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('accesscc');

        return { gateway, contract };
    } catch (error) {
        console.error('❌ Erreur lors de la connexion au réseau Fabric :', error);
        throw error;
    }
}

// === Enregistrement d’un accès (POST) ===
app.post('/api/access', async (req, res) => {
    const { user, action, resource } = req.body;

    if (!user || !action || !resource) {
        return res.status(400).json({ error: 'Champs requis : user, action, resource.' });
    }

    const timestamp = new Date().toISOString();

    try {
        const { contract } = await connectToNetwork();
        const result = await contract.submitTransaction(
            'recordAccess',
            user,
            action,
            resource,
            timestamp
        );

        res.json({ success: true, recorded: JSON.parse(result.toString()) });
    } catch (error) {
        console.error('❌ Erreur lors de l’enregistrement :', error);
        res.status(500).json({ error: 'Erreur lors de l’enregistrement de l’accès', details: error.message });
    }
});

// === Historique des accès d’un utilisateur (GET) ===
app.get('/api/history/:user', async (req, res) => {
    const user = req.params.user;

    if (!user) {
        return res.status(400).json({ error: 'Paramètre utilisateur manquant.' });
    }

    try {
        const { contract } = await connectToNetwork();
        const result = await contract.evaluateTransaction('getAccessHistory', user);

        res.json({ history: JSON.parse(result.toString()) });
    } catch (error) {
        console.error('❌ Erreur lors de la récupération de l’historique :', error);
        res.status(500).json({ error: 'Erreur lors de la récupération de l’historique', details: error.message });
    }
});

// === Authentification via Active Directory (POST) ===
app.post('/api/auth', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Nom d’utilisateur et mot de passe requis.' });
    }

        ad.authenticate(username, password, async (err, auth) => {
        if (err) {
            console.error('❌ Erreur AD :', err);
            return res.status(500).json({ message: 'Erreur lors de l’authentification AD', details: err });
        }

        if (auth) {
            return res.json({ success: true, message: 'Authentification réussie.' });
        } else {
            return res.status(401).json({ success: false, message: 'Échec de l’authentification.' });
        }
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`✅ Serveur API démarré sur http://localhost:${PORT}`);
});
   