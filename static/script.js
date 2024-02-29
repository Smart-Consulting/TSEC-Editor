$(function() {
    function loadTables() {
        $.ajax({
            url: '/get-tables',
            method: 'GET',
            success: function(tables) {
                var tableList = $('#table-list');
                tables.forEach(function(table) {
                    var tableItem = $('<div class="table-item"></div>');
                    var tableNameElement = $('<div class="table-name" data-table="' + table + '">' + table + '</div>');
                    var options = $('<div class="options" style="display: none; margin-left: 30px;"></div>');
                    if (table === 'TSECINFO') {
                        options.append('<div class="option" data-table="' + table + '" data-option="new-update">New/update</div>');
                        options.append('<div class="option" data-table="' + table + '" data-option="load">Load</div>');
                        options.append('<div class="option" data-table="' + table + '" data-option="generate">Generate</div>');
                    }
                    tableItem.append(tableNameElement);
                    tableItem.append(options);
                    tableList.append(tableItem);
                });

                $('.table-name').click(function() {
                    var tableName = $(this).data('table');
                    loadTableData(tableName);
                    var options = $(this).siblings('.options');
                    if (tableName === 'TSECINFO') {
                        options.toggle(); 
                    } else {
                        $('.options').hide(); 
                    }
                });

                $('.option').click(function() {
                    var tableName = $(this).data('table');
                    var option = $(this).data('option');
                    console.log("Table:", tableName, "Option:", option);
                });
            }
        });
    }

    function loadTableData(tableName) {
        $.ajax({
            url: '/tables/' + tableName,
            method: 'GET',
            success: function(data) {
                var tableDataDiv = $('#table-data');
                tableDataDiv.empty();
                var html = '<table>';
                data.forEach(function(row) {
                    html += '<tr>';
                    for (var key in row) {
                        html += '<td>' + row[key] + '</td>';
                    }
                    html += '</tr>';
                });
                html += '</table>';
                tableDataDiv.html(html);
            }
        });
    }

    // Fonction pour afficher le formulaire lorsque l'option "New/Update" est sélectionnée
    function showFormForNewUpdate(tableName) {
        if (tableName === 'TSECINFO') {
            // Récupérer les informations sur les colonnes de la table depuis le serveur
            $.ajax({
                url: '/table-columns/' + tableName,
                method: 'GET',
                success: function(columns) {
                    // Générer dynamiquement le formulaire en fonction des colonnes
                    var form = $('<form id="newEntryForm"></form>');
    
                    // Créer les champs d'entrée du formulaire
                    columns.forEach(function(column) {
                        var inputType = 'text'; // Par défaut, le champ est de type texte
                        // Si le champ est auto-incrémenté ou une clé primaire/secondaire, le rendre grisé et pré-rempli
                        if (column['Extra'] === 'auto_increment' || column['Key'] === 'PRI' || column['Key'] === 'UNI') {
                            inputType = 'text'; // Changer le type en texte
                            var input = $('<input type="' + inputType + '" name="' + column['Field'] + '" placeholder="' + column['Field'] + '" required readonly>');
                            // Utiliser le nom de la colonne comme placeholder
                            input.val(column['Field']);
                            input.prop('disabled', true); // Rendre le champ grisé et désactivé
                        } else {
                            var input = $('<input type="' + inputType + '" name="' + column['Field'] + '" placeholder="' + column['Field'] + '" required>');
                        }
                        // Ajouter l'élément input au formulaire
                        form.append(input);
                    });
    
                    // Ajouter un bouton de soumission
                    form.append('<button type="submit">Enregistrer</button>');
                    // Afficher le formulaire
                    $('#table-data').html(form);
                },
                error: function(xhr, status, error) {
                    console.error('Erreur lors de la récupération des colonnes de la table:', error);
                }
            });
        }
    }
    
    

    // Appeler la fonction loadTables pour charger les tables au démarrage de la page
    loadTables();

    // Gérer l'événement de soumission du formulaire pour ajouter une nouvelle entrée
    $(document).on('submit', '#newEntryForm', function(e) {
        e.preventDefault();
        var formData = {};
        $(this).serializeArray().forEach(function(item) {
            formData[item.name] = item.value;
        });
    
        $.ajax({
            url: '/tables/TSECINFO',
            method: 'POST',
            contentType: 'application/json', // Indiquer que vous envoyez des données JSON
            data: JSON.stringify(formData), // Convertir les données en JSON
            success: function(response) {
                console.log('Nouvelle entrée ajoutée avec succès:', response);
                // Réinitialiser le formulaire après avoir soumis les données
                $('#newEntryForm')[0].reset();
                // Masquer le formulaire après avoir soumis les données
                $('#newEntryForm').hide();
            },
            error: function(xhr, status, error) {
                console.error('Erreur lors de l\'ajout de la nouvelle entrée:', error);
            }
        });
    });
    

    // Gérer l'événement de clic sur l'option "New/Update"
    $(document).on('click', '.option[data-option="new-update"]', function() {
        var tableName = $(this).data('table');
        showFormForNewUpdate(tableName);
    });

    // Gérer l'événement de clic sur l'option "Load"
$(document).on('click', '.option[data-option="load"]', function() {
    var tableName = $(this).data('table');
    loadTSECOptions(tableName);
});

// Fonction pour charger les options TSEC
function loadTSECOptions(tableName) {
    $.ajax({
        url: '/tables/' + tableName,
        method: 'GET',
        success: function(data) {
            // Créer un menu déroulant pour les TSEC
            var select = $('<select id="tsec-options"></select>');
            // Remplir le menu déroulant avec les données TSEC
            data.forEach(function(row) {
                // Concaténer le TSECID et le nom pour chaque option
                var optionText = row['TSECID'] + ' : ' + row['Name'];
                select.append($('<option></option>').attr('value', row['TSECID']).text(optionText));
            });
            // Ajouter un bouton de chargement des données TSEC sélectionnées
            select.append($('<option selected disabled hidden></option>').text('Choisissez un TSEC'));
            select.append('<button id="load-tsec-btn">Charger</button>');
            // Afficher le menu déroulant
            $('#table-data').html(select);
        },
        error: function(xhr, status, error) {
            console.error('Erreur lors du chargement des options TSEC:', error);
        }
    });
}

// Gérer le chargement des données TSEC sélectionnées
$(document).on('click', '#load-tsec-btn', function() {
    var selectedTSECID = $('#tsec-options').val();
    console.log('TSEC sélectionné:', selectedTSECID);
    // Ajoutez ici la logique pour charger les données du TSEC sélectionné
});


});
