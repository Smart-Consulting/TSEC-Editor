import mysql.connector

# Paramètres de connexion à la base de données
db_config = {
    'host': "host",
    'user': "user",
    'password': "password",
    'database': "db",
    'port': "port"
}


# Fonction pour obtenir la connexion à la base de données
def get_db_connection():
    connexion = mysql.connector.connect(**db_config)
    return connexion
