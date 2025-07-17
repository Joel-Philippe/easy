# 📧 Configuration Email Firebase - Guide Complet

## 🎯 Solution Recommandée : Firebase Extensions + Gmail/Outlook Pro

### 1️⃣ Installation de l'extension Firebase Email

```bash
# Installer Firebase CLI si pas déjà fait
npm install -g firebase-tools

# Se connecter à Firebase
firebase login

# Installer l'extension Email
firebase ext:install firestore-send-email
```

### 2️⃣ Configuration de l'extension

Lors de l'installation, vous devrez configurer :

- **SMTP Host** : `smtp.gmail.com` (pour Gmail Pro) ou `smtp-mail.outlook.com` (pour Outlook)
- **SMTP Port** : `587`
- **SMTP Username** : `votre-email@votre-domaine.com`
- **SMTP Password** : Mot de passe d'application (voir étapes ci-dessous)
- **Default FROM** : `noreply@votre-domaine.com`
- **Default REPLY-TO** : `support@votre-domaine.com`

### 3️⃣ Création d'un email professionnel

#### Option A : Google Workspace (Recommandé)
1. Allez sur [workspace.google.com](https://workspace.google.com)
2. Créez un compte avec votre domaine
3. Coût : ~6€/mois par utilisateur
4. Avantages : Intégration parfaite, fiable, support 24/7

#### Option B : Microsoft 365
1. Allez sur [microsoft.com/microsoft-365/business](https://www.microsoft.com/microsoft-365/business)
2. Choisissez le plan Business Basic
3. Coût : ~5€/mois par utilisateur

#### Option C : Solution gratuite (pour tests)
1. Utilisez Gmail avec un domaine personnalisé
2. Activez l'authentification à 2 facteurs
3. Générez un mot de passe d'application

### 4️⃣ Configuration du mot de passe d'application

#### Pour Gmail :
1. Allez dans votre compte Google
2. Sécurité → Authentification à 2 facteurs
3. Mots de passe des applications
4. Générez un mot de passe pour "Mail"

#### Pour Outlook :
1. Allez dans votre compte Microsoft
2. Sécurité → Options de sécurité avancées
3. Mots de passe d'application
4. Créez un nouveau mot de passe

### 5️⃣ Variables d'environnement Firebase

Ajoutez dans votre projet Firebase (Console → Project Settings → Service Accounts) :

```env
SMTP_CONNECTION_URI=smtps://votre-email@votre-domaine.com:mot-de-passe-app@smtp.gmail.com:465
DEFAULT_FROM=noreply@votre-domaine.com
DEFAULT_REPLY_TO=support@votre-domaine.com
```

## 📋 Template d'email professionnel

L'extension Firebase utilise des templates HTML. Voici un exemple :

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Confirmation de commande</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .order-item { border-bottom: 1px solid #ddd; padding: 10px 0; }
        .total { font-size: 18px; font-weight: bold; color: #667eea; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Merci pour votre commande !</h1>
            <p>Commande confirmée pour {{customerName}}</p>
        </div>
        
        <div class="content">
            <h2>📋 Détails de votre commande</h2>
            <p><strong>Email :</strong> {{customerEmail}}</p>
            <p><strong>Date :</strong> {{orderDate}}</p>
            
            <h3>🛍️ Articles commandés :</h3>
            {{#each items}}
            <div class="order-item">
                <strong>{{this.title}}</strong><br>
                Quantité : {{this.count}} × {{this.price}}€<br>
                <em>Total : {{this.total}}€</em>
            </div>
            {{/each}}
            
            <div class="total">
                💰 Total payé : {{totalPaid}}€
            </div>
            
            <h3>🚚 Informations de livraison :</h3>
            <p>
                {{deliveryInfo.firstName}} {{deliveryInfo.lastName}}<br>
                {{deliveryInfo.address}}<br>
                {{deliveryInfo.postalCode}} {{deliveryInfo.city}}<br>
                {{deliveryInfo.country}}
            </p>
        </div>
        
        <div class="footer">
            <p>Merci de votre confiance ! 💜</p>
            <p>Support : support@votre-domaine.com | Tél : +33 1 23 45 67 89</p>
        </div>
    </div>
</body>
</html>
```

## 🔧 Avantages de cette solution

✅ **Professionnel** : Emails depuis votre domaine  
✅ **Fiable** : Infrastructure Google/Microsoft  
✅ **Scalable** : Gère des milliers d'emails  
✅ **Templates** : HTML personnalisables  
✅ **Tracking** : Suivi des envois et erreurs  
✅ **Sécurisé** : Chiffrement et authentification  

## 💰 Coûts

- **Firebase Extensions** : Gratuit
- **Google Workspace** : ~6€/mois
- **Envois d'emails** : Inclus (jusqu'à limites généreuses)

## 🚀 Alternative rapide : Resend

Si vous voulez une solution encore plus simple :

1. Créez un compte sur [resend.com](https://resend.com)
2. Vérifiez votre domaine
3. Utilisez leur API directement
4. Coût : Gratuit jusqu'à 3000 emails/mois