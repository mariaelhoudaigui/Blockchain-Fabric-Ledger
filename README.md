# Decentralized Access Management with Hyperledger-Fabric & ADDS

## Project Overview

This project implements a hybrid access management system combining:

* Centralized user management via **Active Directory Domain Services (AD DS)** on Windows Server
* Decentralized access verification and immutable logging through **Hyperledger Fabric** blockchain (running on an Ubuntu VM)
* Secure folder, with access control and logging enforced by blockchain smart contracts

All directory changes (file additions, modifications, deletions) are captured, validated, and recorded on the blockchain, ensuring tamper-proof and auditable access logs.

## Components

* **Smart Contracts** (`access.js`) written in JavaScript for Hyperledger Fabric
* **Wallets** storing admin and user identities for blockchain signing operations
* **Node.js Backend**:
  * `app.js` – handles AD DS authentication and submits access events to the blockchain
  * `watcher.js` – monitors folder activity and logs events via the backend API
* **Frontend HTML** – for testing authentication and blockchain logging
* **Infrastructure**:
  * **VM1**: Windows Server with AD DS, IIS, and Windows Admin Center (WAC)
  * **VM2**: Windows Server client joined to the AD domain
  * **VM3**: Ubuntu VM running Dockerized Hyperledger Fabric network

## How `watcher.js` Works

* Detects file events: creation, modification, deletion
* Sends event details (user, action, resource) via POST to `/api/access`
* The backend validates and logs these events immutably on the blockchain

## Deployment & Setup Summary

1. Configure Windows Server VM1 with AD DS, IIS, WAC, and set up user accounts
2. Join Windows Server VM2 to the AD domain
3. Prepare Ubuntu VM (VM3) with Docker, Docker Compose, and deploy Fabric network
4. Deploy `access.js` chaincode to the Fabric network
5. Run `app.js` and `watcher.js` 

## Important Setup Commands

```powershell
# On Windows Server VM1
Install-WindowsFeature AD-Domain-Services -IncludeManagementTools
Install-ADDSForest -DomainName "xxxx.xxxx" -InstallDns
Install-WindowsFeature Web-Server -IncludeManagementTools
Install-WindowsFeature WindowsAdminCenter

New-ADUser -Name "user1" -AccountPassword (ConvertTo-SecureString "SecureP@ss123" -AsPlainText -Force) -Enabled $true
New-SmbShare -Name "partagesecure" -Path "C:\PartageSecure" -FullAccess "xxxx.xxxx\user1"

# On Windows Server VM2
Add-Computer -DomainName "xxxx.xxxx" -Credential (Get-Credential) -Restart

# On Ubuntu VM3
sudo apt install docker-compose
curl -sSL https://bit.ly/2ysbOFn | bash -s
cd fabric-samples/test-network
./network.sh up createChannel
./network.sh deployCC -ccn accesscc -ccp ../chaincode/access-javascript -ccl javascript
node enrollAdmin.js     #to create admin.id into the wallet
node registerUser.js     #to create user.id into the wallet


