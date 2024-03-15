var currentTSECID = null;
var currentTSECName = null; 

$(document).ready(function() {

    // Fonction générique pour charger les tables
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

                // Gérer les événements de clic sur les noms de table et les options
                $('.table-name').click(function() {
                    var tableName = $(this).data('table');
                    $('#table-data').empty();
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

    // Fonction générique pour charger les données d'une table
    function loadTableData(tableName) {
        $.ajax({
            url: '/tables/' + tableName,
            method: 'GET',
            success: function(data) {
                var tableDataDiv = $('#table-data');
                tableDataDiv.empty();
                var html = '<table>';
                html += '<tr>';
                for (var key in data[0]) {
                    html += '<th>' + key + '</th>';
                }
                html += '</tr>';
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

    // Fonction générique pour afficher un formulaire pour une nouvelle entrée dans TSECINFO
    function showFormForNewTSEC(tableName) {
        if (tableName === 'TSECINFO') {
            $.ajax({
                url: '/table-columns/' + tableName,
                method: 'GET',
                success: function(columns) {
                    var form = $('<form id="newEntryForm"></form>');
                    columns.forEach(function(column) {
                        var inputType = 'text';
                        if (column['Extra'] === 'auto_increment' || column['Key'] === 'PRI' || column['Key'] === 'UNI' || column['Key'] === 'MUL') {
                            var input = $('<input type="' + inputType + '" name="' + column['Field'] + '" placeholder="' + column['Field'] + '" required readonly>');
                            input.val(column['Field']);
                            input.prop('disabled', true);
                        } else {
                            var input = $('<input type="' + inputType + '" name="' + column['Field'] + '" placeholder="' + column['Field'] + '" required>');
                        }
                        form.append('<br>');
                        form.append(input);
                    });
                    form.append('<br>');
                    form.append('<button type="submit">Enregistrer</button>');
                    $('#table-data').html(form);
                },
                error: function(xhr, status, error) {
                    console.error('Erreur lors de la récupération des colonnes de la table:', error);
                }
            });
        }
    }

    // Gérer la soumission du formulaire pour une nouvelle entrée dans TSECINFO
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
                $('#newEntryForm')[0].reset();
                $('#newEntryForm').hide();
                alert('Nouvelle entrée ajoutée avec succès !');
            },
            error: function(xhr, status, error) {
                console.error('Erreur lors de l\'ajout de la nouvelle entrée:', error);
            }
        });
    }

    // Fonction générique pour charger les options TSEC
    function loadTSECOptions(tableName) {
        $.ajax({
            url: '/tables/' + tableName,
            method: 'GET',
            success: function(data) {
                var select = $('<select id="tsec-options"></select>');
                select.append($('<option selected disabled hidden></option>').text('Choisissez un TSEC'));
                data.forEach(function(row) {
                    var optionText = row['id'] + ' : ' + row['Name'];
                    var option = $('<option></option>').attr('value', row['id']).text(optionText);
                    // Vérifier si l'ID du TSEC correspond à l'ID stocké dans la variable globale
                    if (currentTSECID && row['id'] == currentTSECID) {
                        option.attr('selected', 'selected');
                    }
                    select.append(option);
                });
                var useButton = $('<button>Utiliser</button>').click(function() {
                    if (currentTSECID) {
                        alert('TSEC ' + currentTSECID + ' sélectionné pour utilisation.');
                    }
                });
                var editButton = $('<button>Modifier</button>').click(function() {
                    showEditFormForTSEC(currentTSECID);
                });
                $('#table-data').html(select);
                $('#table-data').append(useButton, editButton);
                select.change(function() {
                    var selectedOption = $(this).find(':selected');
                    currentTSECID = selectedOption.val();
                    currentTSECName = selectedOption.text().split(' : ')[1]; 
                });
            },
            error: function(xhr, status, error) {
                console.error('Erreur lors du chargement des options TSEC:', error);
            }
        });
    }
    
    

    // Fonction générique pour afficher un formulaire d'édition pour un TSEC spécifié
    function showEditFormForTSEC(selectedTSECID) {
        $.ajax({
            url: '/tables/TSECINFO/' + selectedTSECID,
            method: 'GET',
            success: function(data) {
                var form = $('<form id="editTSECForm"></form>');
                for (var key in data) {
                    var inputType = 'text';
                    var readonly = '';
                    if (key === 'TSECID') {
                        readonly = 'readonly';
                    }
                    var input = $('<input type="' + inputType + '" name="' + key + '" placeholder="' + key + '" required ' + readonly + '>');
                    input.val(data[key]);
                    if (key === 'TSECID') {
                        input.css('background-color', '#f2f2f2');
                    }
                    form.append('<br>');
                    form.append('<label>' + key + '</label> : ');
                    form.append(input);
                }
                form.append('<br>');
                form.append('<button type="submit">Enregistrer</button>');
                form.append('<button id="deleteTSECButton" type="button">Supprimer</button>');
                $('#table-data').html(form);
            },
            error: function(xhr, status, error) {
                console.error('Erreur lors de la récupération des détails du TSEC:', error);
            }
        });
    }

    // Gérer la soumission du formulaire pour l'édition d'un TSEC
    function handleEditTSECFormSubmission(e) {
        e.preventDefault();
        var formData = {};
        $(this).serializeArray().forEach(function(item) {
            formData[item.name] = item.value;
        });
        $.ajax({
            url: '/tables/TSECINFO/' + formData.TSECID,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function(response) {
                console.log('Données du TSEC mises à jour avec succès:', response);
                alert('Les données ont été mises à jour avec succès !');
                $('#editTSECForm').hide();
            },
            error: function(xhr, status, error) {
                console.error('Erreur lors de la mise à jour des données du TSEC:', error);
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
                $('#editTSECForm').hide();
            },
            error: function(xhr, status, error) {
                console.error('Erreur lors de la suppression du TSEC:', error);
            }
        });
    }

    // Afficher le formulaire pour une nouvelle question
    function showFormForNewQuestion() {
        $.ajax({
            url: '/tables/GROUP_QUESTIONS',
            method: 'GET',
            success: function(groups) {
                var form = $('<form id="newQuestionForm"></form>');
                var selectGroup = $('<select id="groupSelect" name="GroupQIDRef" required></select>');
                selectGroup.append('<option value="">Sélectionnez un groupe</option>');
                groups.forEach(function(group) {
                    selectGroup.append($('<option></option>').attr('value', group.id).text(group.id + ' : ' + group.GroupNb));
                });
                var createGroupButton = $('<button type="button" id="createNewGroup">Nouveau</button>');
                var editGroupButton = $('<button type="button" id="editGroupButton">Modifier</button>');
                form.append('<label for="groupSelect">Groupe :</label>');
                form.append(selectGroup);
                form.append(editGroupButton);
                form.append(createGroupButton);
                form.append('<br><br>');
                $.ajax({
                    url: '/table-columns/QUESTIONS',
                    method: 'GET',
                    success: function(columns) {
                        columns.forEach(function(column) {
                            if (column.Field === 'TSECIDRef' && currentTSECID) {
                                // Pré-remplir le champ TSECID avec l'ID et le nom du TSEC sélectionné
                                var tsecIdRefInput = $('<input>').attr({
                                    type: 'text',
                                    name: 'TSECIDRef',
                                    value: currentTSECID + ' : ' + currentTSECName, // ID et nom du TSEC
                                    readonly: true, 
                                    disabled: true 
                                });
                                form.append(tsecIdRefInput);
                                form.append('<br>');
                            } else if (!['id', 'Extra', 'Key', 'TSECIDRef'].includes(column.Field)) {
                                var input = $('<input>').attr({
                                    type: 'text',
                                    name: column.Field,
                                    placeholder: column.Field,
                                    required: column.Null === 'NO' // Rendre le champ requis si le champ n'est pas nullable
                                });
                                form.append(input);
                                form.append('<br>');
                            }
                        });
                        form.append('<button type="submit">Ajouter la Question</button>');
                        $('#table-data').html(form);

                        // Gérer l'événement de changement de sélection du groupe
                        selectGroup.change(function() {
                            var selectedGroupId = $(this).val(); // Obtenir l'ID du groupe sélectionné
                            $('input[name="GroupQIDRef"]').val(selectedGroupId); // Mettre à jour la valeur du champ GroupQIDRef
                        });

                        // Désactiver le champ GroupQIDRef pour qu'il ne soit pas modifiable manuellement
                        $('input[name="GroupQIDRef"]').prop('disabled', true);
                    }
                });
            },
            error: function(xhr, status, error) {
                console.error('Erreur lors du chargement des groupes de questions :', error);
            }
        });
    }
    
    // Gérer la soumission du formulaire de nouvelle question
    function handleNewQuestionForm(e) {
        e.preventDefault();
        var formData = {};
        formData['GroupQIDRef'] = $('#groupSelect').val();
        formData['TSECIDRef'] = currentTSECID;
        $(this).serializeArray().forEach(function(item) {
            if (item.name !== 'GroupQIDRef' && item.name !== 'TSECIDRef') {
                formData[item.name] = item.value;
            }
        });
        $.ajax({
            url: '/tables/QUESTIONS',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function(response) {
                console.log('Nouvelle question ajoutée avec succès:', response);
                $('#newQuestionForm')[0].reset();
                $('#newQuestionForm').hide();
                alert('Nouvelle question ajoutée avec succès !');
            },
            error: function(xhr, status, error) {
                console.error('Erreur lors de l\'ajout de la nouvelle question:', error);
            }
        });
    }
    


    // Afficher le formulaire pour créer un nouveau groupe
    function showCreateGroupForm() {
        var form = $('#createGroupForm');

        // Vérifier si le formulaire existe déjà
        if (form.length === 0) {
            // Le formulaire n'existe pas, donc nous le créons et l'affichons
            $.ajax({
                url: '/table-columns/GROUP_QUESTIONS',
                method: 'GET',
                success: function(columns) {
                    form = $('<form id="createGroupForm"></form>');

                    // Parcourir les colonnes récupérées pour créer les champs de formulaire
                    columns.forEach(function(column) {
                        // Ignorer les colonnes qui ne sont pas nécessaires dans le formulaire
                        if (!['id', 'Extra', 'Key'].includes(column.Field)) {
                            var input = $('<input>').attr({
                                type: 'text',
                                id: 'newGroup' + column.Field,
                                name: column.Field,
                                placeholder: column.Field
                            });
                            // Vérifier si le champ est nullable
                            if (column.Null === 'YES') {
                                input.prop('required', false); // Rendre le champ non obligatoire
                            } else {
                                input.prop('required', true); // Rendre le champ obligatoire
                            }
                            form.append(input);
                            form.append('<br>');
                        }
                    });

                    // Trouver le champ TSECIDRef existant dans le formulaire
                    var tsecIdRefInput = form.find('input[name="TSECIDRef"]');
                    if (tsecIdRefInput.length > 0) {
                        // Si le champ existe, pré-remplir avec la valeur de TSECID sélectionnée
                        tsecIdRefInput.val(currentTSECID);
                        tsecIdRefInput.prop('readonly', true);
                    } else {
                        // Si le champ n'existe pas, affichez un message d'erreur ou gérez-le comme vous le souhaitez
                        console.error('Le champ TSECIDRef n\'a pas été trouvé dans le formulaire.');
                    }

                    // Ajouter le bouton de soumission pour le formulaire de création de groupe
                    form.append('<br>');
                    form.append('<button type="button" id="submitCreateGroup">Créer le groupe</button>');

                    $('#table-data').append(form);
                    // Afficher le formulaire
                    form.show();

                    // Mettre à jour le texte du bouton
                    var buttonText = form.is(":visible") ? "Fermer le formulaire" : "Nouveau";
                    $('#createNewGroup').text(buttonText);

                    // Écouter l'événement de clic sur le bouton de soumission
                    $('#submitCreateGroup').on('click', function() {
                        createNewGroup();
                    });
                },
                error: function(xhr, status, error) {
                    console.error('Erreur lors du chargement des colonnes de la table GROUP_QUESTIONS :', error);
                }
            });
        } else {
            // Le formulaire existe déjà, nous le cachons et mettons à jour le texte du bouton
            form.toggle();
            var buttonText = form.is(":visible") ? "Fermer le formulaire" : "Nouveau";
            $('#createNewGroup').text(buttonText);
        }
    }

    // Fonction pour créer un nouveau groupe
    function createNewGroup() {
        var formData = {};
        // Collecter les données du formulaire
        $('#createGroupForm input').each(function() {
            // Vérifier si le champ est TSECIDRef
            if ($(this).attr('name') === 'TSECIDRef') {
                // Récupérer seulement l'ID du TSEC
                formData['TSECIDRef'] = $(this).val().split(' ')[0];
            } else {
                formData[$(this).attr('name')] = $(this).val();
            }
        });
        // Effectuer une requête POST pour créer un nouveau groupe
        $.ajax({
            url: '/tables/GROUP_QUESTIONS',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function(response) {
                console.log('Nouveau groupe créé avec succès:', response);
                // Réinitialiser le formulaire après la création du groupe
                $('#createGroupForm')[0].reset();
                // Afficher un message de succès à l'utilisateur
                alert('Nouveau groupe créé avec succès !');
            },
            error: function(xhr, status, error) {
                console.error('Erreur lors de la création du nouveau groupe:', error);
                // Gérer l'erreur et afficher un message à l'utilisateur si nécessaire
            }
        });
    }


    // Gérer l'événement de clic sur le bouton "Modifier"
    function showEditGroupForm(groupId) {
        $.ajax({
            url: '/tables/GROUP_QUESTIONS/' + groupId,
            method: 'GET',
            success: function(groupData) {
                // Construit le formulaire de modification en utilisant les données du groupe
                var formHtml = '<form id="editGroupForm">';
                Object.keys(groupData).forEach(function(key) {
                    formHtml += '<label for="' + key + '">' + key + ':</label>';
                    formHtml += '<input type="text" name="' + key + '" value="' + groupData[key] + '"><br>';
                });
                formHtml += '<button type="submit">Sauvegarder les modifications</button>';
                formHtml += '</form>';
    
                $('#table-data').html(formHtml); // Affiche le formulaire
    
                // Gère la soumission du formulaire
                $('#editGroupForm').on('submit', function(e) {
                    e.preventDefault();
                    var formData = $(this).serializeArray().reduce(function(obj, item) {
                        obj[item.name] = item.value;
                        return obj;
                    }, {});
                    updateGroupData(groupId, formData); // Envoie les modifications
                });
            },
            error: function(error) {
                console.error("Erreur lors du chargement des données du groupe : ", error);
            }
        });
    }
    
    
    function updateGroupData(groupId, formData) {
        $.ajax({
            url: '/tables/GROUP_QUESTIONS/' + groupId,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function(response) {
                alert('Modifications enregistrées avec succès.');
                // Actions supplémentaires après la mise à jour (par exemple, rafraîchir les données affichées)
            },
            error: function(error) {
                console.error("Erreur lors de la mise à jour des données du groupe : ", error);
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

    $(document).on('submit', '#newEntryForm', handleNewTSECFormSubmission);
    $(document).on('submit', '#editTSECForm', handleEditTSECFormSubmission);
    $(document).on('click', '#editTSECForm button[type="submit"]', function(e) {
        e.preventDefault();
        $('#editTSECForm').submit();
    });
    $(document).on('click', '.option[data-option="new"]', function() {
        var tableName = $(this).data('table');
        showFormForNewTSEC(tableName);
    });

    $(document).on('click', '.option[data-option="load-update"]', function() {
        var tableName = $(this).data('table');
        loadTSECOptions(tableName);
    });

    $(document).on('click', '.option[data-table="QUESTIONS"][data-option="new"]', function() {
        showFormForNewQuestion();
    });
    
    $(document).on('submit', '#newQuestionForm', handleNewQuestionForm);

    $(document).on('click', '#createNewGroup', function() {
        showCreateGroupForm(); 
    });

    $(document).on('click', '#editGroupButton', function() {
        var groupId = $('#groupSelect').val(); 
        if (groupId) {
            showEditGroupForm(groupId); 
        } else {
            alert("Veuillez sélectionner un groupe à modifier.");
        }
    });    

    loadTables();

});