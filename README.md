# zkPass -- A crypto passport based on Mina, Zero Knowledage

zkpass is a crypto identity dapp, it can not only be a wallet based on smart contract, but also even an identity authenticator. 

You can 
- register an account with a special `name`,
- transfer funds to `ANYONE` by its `name`,
- withdraw from this account, 
- ......

**PLEASE navigate to `./demohtml/index.html` to take a look at our MVP design!!**

It protects your real wallet address from exposure (all transactions are by `name`, rather than your wallet address) and allows for a degree of anonymity in transfers. 

Besides, it can be integrated into other DApps as a single sign-on.

And it can also be authorized by your email in the future without fear of losing your private key.

Features:
- All user data are hashed across the whole snapp scope, including the data stored off chain. 
- As a snapp with ZK proof from Mina, user could operate locally without exposing any of its wallet info, so no one could trace your on-chain activities of your real wallet address.
- Be able to Be an authenticator for any senarioes needing your signature, like SSO.
- Multiple class public keys instended for respective senario. for examples, Authorization key is intended for signature, while withdraw Public key is only for withdrawing funds from zkpass platform. So you no need worrying that some one would know your real fund wallet address.
- In the future, social recovery of your wallet could be carried out. You will not need to worry about losing your private key.