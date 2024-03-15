# TSEC-Editor

## Configuration de la base de données

Avant de lancer le projet, assurez-vous de modifier les informations de connexion dans le fichier `db.py`.

```python
# Paramètres de connexion à la base de données
db_config = {
    'host': "localhost",
    'user': "user",
    'password': "password",
    'database': "db",
    'port': "port"
}
```

## Lancement du projet

Pour démarrer le serveur back-end et le serveur front-end simultanément, exécutez la commande suivante :

```
npm run start:full
```

---

**Remarque:** Assurez-vous d'avoir toutes les dépendances installées avant d'exécuter cette commande.
