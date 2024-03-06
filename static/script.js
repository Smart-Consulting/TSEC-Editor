

$(document).ready(function() {

    function loadTables() {
        $.ajax({
            url: '/get-tables',
            method: 'GET',
            success: function(allTables) {
                var tableOrder = [
                    'TSECINFO',
                    'QUESTIONS',
                    'ERRORS',
                    'SUGGESTS',
                    'CONTEXTS',
                    'PASS_CRITERIA',
                    'INFRPT',
                    'CARDS',
                    'TESTCASES'
                ];
    
                var tableList = $('#table-list');
                tableOrder.forEach(function(tableName) {
                    if (allTables.includes(tableName)) {
                        var tableItem = $('<div class="table-item"></div>');
                        var tableNameElement = $('<div class="table-name" data-table="' + tableName + '">' + tableName + '</div>');
                        var options = $('<div class="options" style="display: none; margin-left: 30px;"></div>');
                        if (tableName === 'TSECINFO') {
                            options.append('<div class="option" data-table="' + tableName + '" data-option="new">New</div>');
                            options.append('<div class="option" data-table="' + tableName + '" data-option="load-update">Load/Update</div>');
                            options.append('<div class="option" data-table="' + tableName + '" data-option="generate">Generate</div>');
                        } else if (tableName === 'QUESTIONS') {
                            options.append('<div class="option" data-table="' + tableName + '" data-option="new">New</div>');
                        }
                        tableItem.append(tableNameElement);
                        tableItem.append(options);
                        tableList.append(tableItem);
                    }
                });
    
                $('.table-name').click(function() {
                    var tableName = $(this).data('table');
                    loadTableData(tableName);
                    var options = $(this).siblings('.options');
                    if (tableName === 'TSECINFO' || tableName === 'QUESTIONS') {
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
                // Ajouter une ligne d'en-tête avec les labels des champs
                html += '<tr>';
                for (var key in data[0]) {
                    html += '<th>' + key + '</th>';
                }
                html += '</tr>';
                // Ajouter les données de chaque ligne avec les labels correspondants
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

    function showFormForNewTSEC(tableName) {
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
                        if (column['Extra'] === 'auto_increment' || column['Key'] === 'PRI' || column['Key'] === 'UNI' || column['Key'] === 'MUL') {
                            inputType = 'text'; // Changer le type en texte
                            var input = $('<input type="' + inputType + '" name="' + column['Field'] + '" placeholder="' + column['Field'] + '" required readonly>');
                            // Utiliser le nom de la colonne comme placeholder
                            input.val(column['Field']);
                            input.prop('disabled', true); // Rendre le champ grisé et désactivé
                        } else {
                            var input = $('<input type="' + inputType + '" name="' + column['Field'] + '" placeholder="' + column['Field'] + '" required>');
                        }
                        // Ajouter un saut de ligne avant chaque input
                        form.append('<br>');
                        // Ajouter l'élément input au formulaire
                        form.append(input);
                    });
    
                    // Ajouter un bouton de soumission
                    form.append('<br>');
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
    

    function handleNewTSECFormSubmission(e) {
        e.preventDefault();
        var formData = {};
        $(this).serializeArray().forEach(function(item) {
            formData[item.name] = item.value;
        });
    
        $.ajax({
            url: '/tables/TSECINFO',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function(response) {
                console.log('Nouvelle entrée ajoutée avec succès:', response);
                // Réinitialiser le formulaire après avoir soumis les données
                $('#newEntryForm')[0].reset();
                // Masquer le formulaire après avoir soumis les données
                $('#newEntryForm').hide();
                // Afficher un message de confirmation
                alert('Nouvelle entrée ajoutée avec succès !');
            },
            error: function(xhr, status, error) {
                console.error('Erreur lors de l\'ajout de la nouvelle entrée:', error);
            }
        });
    }

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
                // Ajouter une option par défaut
                select.prepend($('<option selected disabled hidden></option>').text('Choisissez un TSEC'));
                // Afficher le menu déroulant
                $('#table-data').html(select);
    
                // Gérer l'événement de changement de sélection du menu déroulant
                select.change(function() {
                    var selectedTSECID = $(this).val();
                    if (selectedTSECID) {
                        showEditFormForTSEC(selectedTSECID);
                    }
                });
            },
            error: function(xhr, status, error) {
                console.error('Erreur lors du chargement des options TSEC:', error);
            }
        });
    }

    function showEditFormForTSEC(selectedTSECID) {
        $.ajax({
            url: '/tables/TSECINFO/' + selectedTSECID,
            method: 'GET',
            success: function(data) {
                var form = $('<form id="editTSECForm"></form>');
                for (var key in data) {
                    var inputType = 'text';
                    var readonly = ''; // Initialiser readonly à une chaîne vide
                    if (key === 'TSECID') {
                        inputType = 'text';
                        readonly = 'readonly'; // Si c'est l'ID, rendre le champ en lecture seule
                    }
                    var input = $('<input type="' + inputType + '" name="' + key + '" placeholder="' + key + '" required ' + readonly + '>'); // Ajouter readonly à l'attribut HTML si nécessaire
                    input.val(data[key]);
                    if (key === 'TSECID') {
                        input.css('background-color', '#f2f2f2'); // Ajouter un fond gris au champ ID
                    }
                    form.append('<br>'); // Ajouter un retour à la ligne avant chaque label
                    form.append('<label>' + key + '</label> : ');
                    form.append(input);
                }
                form.append('<br>'); // Ajouter un retour à la ligne après tous les champs
                form.append('<button type="submit">Enregistrer</button>');
                // Ajouter le bouton "Supprimer"
                form.append('<button id="deleteTSECButton" type="button">Supprimer</button>');
                $('#table-data').html(form);
            },
            error: function(xhr, status, error) {
                console.error('Erreur lors de la récupération des détails du TSEC:', error);
            }
        });
    }
    
    // Fonction pour gérer la soumission du formulaire pour l'édition d'un TSEC
    function handleEditTSECFormSubmission(e) {
        e.preventDefault(); // Empêcher la soumission du formulaire par défaut
    
        // Récupérer les données du formulaire
        var formData = {};
        $(this).serializeArray().forEach(function(item) {
            formData[item.name] = item.value;
        });
    
        // Envoyer une requête AJAX de type PUT pour mettre à jour les données du TSEC
        $.ajax({
            url: '/tables/TSECINFO/' + formData.TSECID,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function(response) {
                console.log('Données du TSEC mises à jour avec succès:', response);
                // Afficher un message de confirmation
                alert('Les données ont été mises à jour avec succès !');
                // Cacher le formulaire après la mise à jour
                $('#editTSECForm').hide();
            },
            error: function(xhr, status, error) {
                console.error('Erreur lors de la mise à jour des données du TSEC:', error);
                // Ajoutez ici la logique pour gérer les erreurs, par exemple, afficher un message d'erreur à l'utilisateur
            }
        });
    }

    // Fonction pour supprimer un TSEC
    function deleteTSEC(selectedTSECID) {
        $.ajax({
            url: '/tables/TSECINFO/' + selectedTSECID,
            method: 'DELETE',
            success: function(response) {
                console.log('TSEC supprimé avec succès:', response);
                alert('Le TSEC a été supprimé avec succès !');
                $('#editTSECForm').hide(); // Cacher le formulaire après la suppression
                // Ajouter ici la logique pour actualiser l'affichage des données après la suppression
            },
            error: function(xhr, status, error) {
                console.error('Erreur lors de la suppression du TSEC:', error);
                // Ajoutez ici la logique pour gérer les erreurs, par exemple, afficher un message d'erreur à l'utilisateur
            }
        });
    }

    function showFormForNewQuestion() {
        $.ajax({
            url: '/table-columns/Questions',
            method: 'GET',
            success: function(columns) {
                // Générer dynamiquement le formulaire en fonction des colonnes
                var form = $('<form id="newQuestionForm"></form>');
    
                // Créer les champs d'entrée du formulaire
                columns.forEach(function(column) {
                    var inputType = 'text'; // Par défaut, le champ est de type texte
                    // Si le champ est auto-incrémenté ou une clé primaire/secondaire, le rendre grisé et pré-rempli
                    if (column['Extra'] === 'auto_increment' || column['Key'] === 'PRI' || column['Key'] === 'UNI' || column['Key'] === 'MUL')  {
                        inputType = 'text'; // Changer le type en texte
                        var input = $('<input type="' + inputType + '" name="' + column['Field'] + '" placeholder="' + column['Field'] + '" required readonly>');
                        // Utiliser le nom de la colonne comme placeholder
                        input.val(column['Field']);
                        input.prop('disabled', true); // Rendre le champ grisé et désactivé
                    } else {
                        var input = $('<input type="' + inputType + '" name="' + column['Field'] + '" placeholder="' + column['Field'] + '" required>');
                    }
                    // Ajouter un saut de ligne avant chaque input
                    form.append('<br>');
                    // Ajouter l'élément input au formulaire
                    form.append(input);
                });
    
                // Ajouter un bouton de soumission
                form.append('<br>');
                form.append('<button type="submit">Enregistrer</button>');
                // Afficher le formulaire
                $('#table-data').html(form);
            },
            error: function(xhr, status, error) {
                console.error('Erreur lors de la récupération des colonnes de la table Questions:', error);
            }
        });
    }

    // Fonction pour gérer la soumission du formulaire de création d'une nouvelle question
    function handleNewQuestionForm(e) {
        e.preventDefault(); // Empêcher la soumission du formulaire par défaut

        // Récupérer les données du formulaire
        var formData = {};
        $(this).serializeArray().forEach(function(item) {
            formData[item.name] = item.value;
        });

        // Envoyer une requête AJAX de type POST pour ajouter une nouvelle question
        $.ajax({
            url: '/tables/QUESTIONS',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function(response) {
                console.log('Nouvelle question ajoutée avec succès:', response);
                // Réinitialiser le formulaire après avoir soumis les données
                $('#newQuestionForm')[0].reset();
                // Masquer le formulaire après avoir soumis les données
                $('#newQuestionForm').hide();
                // Afficher un message de confirmation
                alert('Nouvelle question ajoutée avec succès !');
                // Recharger la liste des questions triées après avoir ajouté une nouvelle question
                loadSortedQuestions();
            },
            error: function(xhr, status, error) {
                console.error('Erreur lors de l\'ajout de la nouvelle question:', error);
                // Ajoutez ici la logique pour gérer les erreurs, par exemple, afficher un message d'erreur à l'utilisateur
            }
        });
    }



    // Gérer l'événement de clic sur le bouton "Supprimer"
    $(document).on('click', '#deleteTSECButton', function() {
        if (confirm("Êtes-vous sûr de vouloir supprimer ce TSEC ?")) {
            var selectedTSECID = $(this).closest('form').find('input[name="TSECID"]').val();
            deleteTSEC(selectedTSECID);
        }
    });

    // Intercepter la soumission du formulaire 
    $(document).on('submit', '#newEntryForm', handleNewTSECFormSubmission);

    // Intercepter la soumission du formulaire
    $(document).on('submit', '#editTSECForm', handleEditTSECFormSubmission);
    
    // Appeler la fonction pour fermer le formulaire lorsque l'utilisateur clique sur Enregistrer
    $(document).on('click', '#editTSECForm button[type="submit"]', function(e) {
        e.preventDefault(); // Empêcher la soumission du formulaire par défaut
        // Soumettre le formulaire
        $('#editTSECForm').submit();
    });
    
    // Gérer l'événement de clic sur l'option "New/Update"
    $(document).on('click', '.option[data-option="new"]', function() {
        var tableName = $(this).data('table');
        showFormForNewTSEC(tableName);
    });
    
    // Gérer l'événement de clic sur l'option "Load"
    $(document).on('click', '.option[data-option="load-update"]', function() {
        var tableName = $(this).data('table');
        loadTSECOptions(tableName);
    });

    $(document).on('click', '.option[data-table="QUESTIONS"][data-option="new"]', function() {
        showFormForNewQuestion();
    });

    // Intercepter la soumission du formulaire de création d'une nouvelle question
    $(document).on('submit', '#newQuestionForm', handleNewQuestionForm);

    // Appeler la fonction loadTables pour charger les tables au démarrage de la page
    loadTables();
    
});
