import mysql.connector

# Paramètres de connexion à la base de données
db_config = {
    'host': "localhost",
    'user': "user",
    'password': "password",
    'database': "db",
    'port': 8889
}

# Fonction pour obtenir la connexion à la base de données
def get_db_connection():
    connexion = mysql.connector.connect(**db_config)
    return connexion
