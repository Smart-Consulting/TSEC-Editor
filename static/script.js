var currentTSECID = null;
var currentTSECName = null; 
var currentQuestionID = null;
var currentQuestionName = "";
var currentContextsData = {}; 

$(document).ready(function() {

    function escapeSpecialCharacters(text) {
        // Remplace les apostrophes par des caractères d'échappement
        return text.replace(/'/g, "\\'");
    }
    
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
                        if (tableName === 'TSECINFO' || tableName === 'QUESTIONS') {
                            options.append('<div class="option" data-table="' + tableName + '" data-option="new">New</div>');
                            options.append('<div class="option" data-table="' + tableName + '" data-option="load-update">Load/Update</div>');
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
                select.append($('<option disabled></option>').text('Choisissez un TSEC'));
                data.forEach(function(row) {
                    var optionText = row['id'] + ' : ' + row['Name'];
                    var option = $('<option></option>').attr('value', row['id']).text(optionText);
                    select.append(option);
                });
                var useButton = $('<button>Utiliser</button>').click(function() {
                    var selectedOption = $('#tsec-options').find(':selected');
                    currentTSECID = selectedOption.val();
                    currentTSECName = selectedOption.text().split(' : ')[1];
                    if (currentTSECID) {
                        // Stocker l'ID du TSEC sélectionné dans le stockage local du navigateur
                        localStorage.setItem('selectedTSECID', currentTSECID);
                        localStorage.setItem('selectedTSECName', currentTSECName);
                        // Mettre à jour le champ TSECIDRef seulement lorsque le bouton "Utiliser" est cliqué
                        $('input[name="TSECIDRef"]').val(currentTSECID + ' : ' + currentTSECName);
                        alert('TSEC ' + currentTSECID + ' sélectionné pour utilisation.');
                    }
                });
                var editButton = $('<button>Modifier</button>').click(function() {
                    showEditFormForTSEC(currentTSECID);
                });
                $('#table-data').html(select);
                $('#table-data').append(useButton, editButton);

                // Vérifier s'il existe un TSEC sélectionné précédemment dans le stockage local et le sélectionner automatiquement
                var selectedTSECID = localStorage.getItem('selectedTSECID');
                if (!selectedTSECID) {
                    $('#tsec-options').val('Choisissez un TSEC');
                } else {
                    $('#tsec-options').val(selectedTSECID);
                    currentTSECID = selectedTSECID;
                    currentTSECName = localStorage.getItem('selectedTSECName');
                    $('input[name="TSECIDRef"]').val(currentTSECID + ' : ' + currentTSECName);
                }
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
                    if (key === 'id') {
                        readonly = 'readonly';
                    }
                    var input = $('<input type="' + inputType + '" name="' + key + '" placeholder="' + key + '" required ' + readonly + '>');
                    input.val(data[key]);
                    if (key === 'id') {
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
            url: '/tables/TSECINFO/' + formData.id,
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
                form.append('<label for="groupSelect">Groupe de question : </label>');
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
                                var tsecIdRefInput = $('<input>').attr({
                                    type: 'text',
                                    name: 'TSECIDRef',
                                    value: currentTSECID + ' : ' + currentTSECName,
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
                                    required: column.Null === 'NO'
                                });
                                form.append(input);
                                form.append('<br>');
                            }
                        });
                        form.append('<button type="submit">Ajouter la Question</button>');
                        $('#table-data').html(form);
                        selectGroup.change(function() {
                            var selectedGroupId = $(this).val();
                            $('input[name="GroupQIDRef"]').val(selectedGroupId);
                        });
                        $('input[name="GroupQIDRef"]').prop('disabled', true);
                    }
                });
            },
            error: function(xhr, status, error) {
                console.error('Erreur lors du chargement des groupes de questions :', error);
            }
        });
    }

    function loadQuestionsForUpdateAndEdit() {
        $.ajax({
            url: '/tables/QUESTIONS',
            method: 'GET',
            success: function(questions) {
                var questionSelect = $('<select id="questionSelect"></select>').append('<option value="">Sélectionnez une question</option>');
                questions.forEach(function(question) {
                    questionSelect.append($('<option></option>').attr('value', question.id).text(question.id + ': ' + question.QuestName));
                });
    
                var useButton = $('<button>Utiliser</button>').click(function() {
                    var selectedQuestionID = $('#questionSelect').val();
                    if (selectedQuestionID) {
                        currentQuestionID = selectedQuestionID; // Déjà existant
    
                        // Trouvez le nom de la question sélectionnée
                        var selectedOption = $("#questionSelect option:selected").text();
                        currentQuestionName = selectedOption.substring(selectedOption.indexOf(':') + 2); // Extrait le nom de la question
    
                        var editFormContainer = $('#editFormContainer');
                        if(editFormContainer.length) {
                            editFormContainer.empty();
                        }
    
                        useQuestion(selectedQuestionID); // Utilise la question sélectionnée
                    }
                });
    
                var editButton = $('<button>Modifier</button>').click(function() {
                    var selectedQuestionID = $('#questionSelect').val();
                    if (selectedQuestionID) {
                        editQuestion(selectedQuestionID); // Appelle la fonction pour éditer la question sélectionnée
                    }
                });
    
                $('#table-data').html('').append(questionSelect, useButton, editButton);
    
                // Prépare la zone pour les détails des contextes et ajouts
                var contextDetailsDiv = $('<br><br><br><div id="contextDetails"></div><br>'); // Pour afficher les contextes liés
                $('#table-data').append(contextDetailsDiv);
                var contextInterfaceDiv = $('<div id="contextInterface"></div>'); // Pour ajouter de nouveaux contextes
                $('#table-data').append(contextInterfaceDiv);
                
            },
            error: function(xhr, status, error) {
                console.error('Erreur lors du chargement des questions:', error);
            }
        });
    }
    
    function prepareContextAdditionInterface(questionID, callback) {
        $('#contextInterface').prepend('<h3>Formulaire de création</h3>');
        var contextSelect = $('<select id="contextSelect"></select>').append('<option value="">Sélectionnez un contexte</option>');
        $.ajax({
            url: '/tables/CONTEXTS',
            method: 'GET',
            success: function(contexts) {
                contexts.forEach(function(context) {
                    currentContextsData[context.id] = context;
                    contextSelect.append($('<option></option>').attr('value', context.id).text(context.id + ':' + context.ContextNb));
                });
                if (callback && typeof callback === 'function') {
                    callback(); // Exécutez la fonction de rappel après avoir fini de préparer les données
                }
            }
        });
    
        var valueSelect = $('<select id="contextValue"></select>').append('<option value="">Choisir...</option>', '<option value="1">True</option>', '<option value="0">False</option>');
        var addButton = $('<button>Créer</button>').click(function() {
            var selectedContextID = $('#contextSelect').val();
            var value = $('#contextValue').val();
            addContextToQuestion(questionID, selectedContextID, value);
        });
    
        $('#contextInterface').append(contextSelect, valueSelect, addButton);
    }
    
    function loadContextsForQuestion(questionID) {
        $.ajax({
            url: '/tables/QUEST_CTXT',
            method: 'GET',
            success: function(allContextLinks) {
                var table = $('<table></table>').append('<tr><th>ContexteName</th><th>Valeur</th><th>Actions</th></tr>');
                allContextLinks.filter(link => link.QuestIDRef == questionID).forEach(function(contextLink) {
                    var contextData = currentContextsData[contextLink.ContextIDRef];
                    var contextName = contextData ? `${currentQuestionName} ${contextData.Operator} ${contextData.Value}` : 'Inconnu';
    
                    var editButton = $('<button><i class="fa-solid fa-pen-to-square"></i></button>').click(function() {
                        editContext(contextLink.id, contextLink.ContextIDRef, contextLink.Value);
                    });
                    var deleteButton = $('<button><i class="fa-solid fa-trash"></i></button>').click(function() {
                        deleteContext(contextLink.id);
                    });
    
                    var row = $('<tr></tr>')
                        .append('<td>' + contextName + '</td>')
                        .append('<td>' + (contextLink.Value ? 'True' : 'False') + '</td>')
                        .append($('<td></td>').append(editButton, deleteButton));
    
                    table.append(row);
                });
    
                $('#contextDetails').html(allContextLinks.length > 0 ? table : '<p>Aucun contexte lié à cette question.</p>');
            },
            error: function(xhr, status, error) {
                console.error('Erreur lors du chargement des contextes liés:', error);
            }
        });
    }
    
    
    function editQuestion(questionID) {
        $.ajax({
            url: '/table-columns/QUESTIONS',
            method: 'GET',
            success: function(columns) {
                var formHtml = '<form id="editQuestionForm">';
                columns.forEach(function(column) {
                    if (column.Key === 'PRI' || column.Key === 'MUL') {
                        formHtml += `<label for="${column.Field}">${column.Field}:</label>` +
                                    `<input type="text" id="${column.Field}" name="${column.Field}" disabled><br>`;

                    } else {
                        formHtml += `<label for="${column.Field}">${column.Field}:</label>` +
                                    `<input type="text" id="${column.Field}" name="${column.Field}"><br>`;
                    }
                });
                formHtml += '<button type="submit">Sauvegarder les modifications</button></form>';
                $('#table-data').html(formHtml);
                
                fillEditFormWithData(questionID, columns); // Passer les colonnes comme paramètre
            },
            error: function(xhr, status, error) {
                console.error('Erreur lors de la récupération des colonnes:', error);
            }
        });
    }
    
    function fillEditFormWithData(questionID, columns) {
        $.ajax({
            url: '/tables/QUESTIONS/' + questionID,
            method: 'GET',
            success: function(question) {
                columns.forEach(function(column) {
                    $(`#${column.Field}`).val(question[column.Field]);
                });
    
                $('#editQuestionForm').on('submit', function(e) {
                    e.preventDefault();
                    var updatedQuestion = {};
                    columns.forEach(function(column) {
                        // Appliquer l'échappement ici directement
                        var originalValue = $(`#${column.Field}`).val();
                        var escapedValue = escapeSpecialCharacters(originalValue);
                        updatedQuestion[column.Field] = escapedValue;
                    });
                    updateQuestion(questionID, updatedQuestion);
                });
            },
            error: function(xhr, status, error) {
                console.error('Erreur lors de la récupération des données de la question:', error);
            }
        });
    }
    
    
    function updateQuestion(questionID, updatedQuestion) {
        $.ajax({
            url: '/tables/QUESTIONS/' + questionID,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(updatedQuestion),
            success: function() {
                alert('Question mise à jour avec succès.');
                loadQuestionsForUpdateAndEdit(); // Recharge la liste des questions
            },
            error: function(xhr, status, error) {
                console.error('Erreur lors de la mise à jour de la question:', error);
            }
        });
    }
    

    function editContext(contextLinkID) {
        // Premièrement, récupérer les métadonnées de la table pour connaître les champs à générer
        $.ajax({
            url: '/table-columns/QUEST_CTXT',
            method: 'GET',
            success: function(columns) {
                var editFormTitle = '<h3>Formulaire d\'édition</h3>';
                var closeButton = '<button type="button" id="closeEditForm">Fermer</button>';
                var editFormHtml = '<form id="editContextForm">';
                columns.forEach(function(column) {
                    // Générer chaque champ du formulaire basé sur les métadonnées
                    if (column.Field === 'Value') { // Spécifique pour le champ 'Value'
                        editFormHtml += '<label for="' + column.Field + '">' + column.Field + ':</label>' +
                                        '<select id="' + column.Field + '" name="' + column.Field + '">' +
                                        '<option value="1">True</option>' +
                                        '<option value="0">False</option>' +
                                        '</select><br>';
                    } else if (column.Key === 'PRI' || column.Key === 'MUL') {
                        editFormHtml += '<label for="' + column.Field + '">' + column.Field + ':</label>' +
                                        '<input type="text" id="' + column.Field + '" name="' + column.Field + '" disabled><br>';
                    } else {
                        // Champs modifiables
                        editFormHtml += '<label for="' + column.Field + '">' + column.Field + ':</label>' +
                                        '<input type="text" id="' + column.Field + '" name="' + column.Field + '"><br>';
                    }
                });
                editFormHtml += '<button type="submit">Sauvegarder</button><br><br></form>';
                
                // Insérer le formulaire dans le DOM
                var editFormContainer = $('#editFormContainer');
                if (editFormContainer.length === 0) {
                    editFormContainer = $('<div id="editFormContainer"></div>');
                    $('#contextInterface').before(editFormContainer);
                }
                editFormContainer.html(editFormTitle + editFormHtml + closeButton);
                
                // Remplir les champs du formulaire avec les données existantes
                fillEditContextFormWithData(contextLinkID);
                
                $('#closeEditForm').on('click', function() {
                    editFormContainer.empty();
                });
    
                // Gérer la soumission du formulaire
                $('#editContextForm').on('submit', function(e) {
                    e.preventDefault();
                    var formData = {
                        ContextIDRef: $('#ContextIDRef').val(),
                        Value: $('#Value').val()
                    };
                    updateContext(contextLinkID, formData);
                });
            },
            error: function(xhr, status, error) {
                console.error('Erreur lors de la récupération des métadonnées:', error);
            }
        });
    }
    
    function fillEditContextFormWithData(contextLinkID) {
        $.ajax({
            url: '/tables/QUEST_CTXT/' + contextLinkID,
            method: 'GET',
            success: function(data) {
                $('#TSECIDRef').val(data.TSECIDRef);
                $('#id').val(data.id);
                $('#QuestIDRef').val(data.QuestIDRef);
                $('#ContextIDRef').val(data.ContextIDRef);
                $('#Value').val(data.Value.toString()); 
            },
            error: function(xhr, status, error) {
                console.error('Erreur lors de la récupération des données:', error);
            }
        });
    }
    
    function updateContext(contextLinkID, updatedData) {
        $.ajax({
            url: '/tables/QUEST_CTXT/' + contextLinkID,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(updatedData),
            success: function() {
                alert('Contexte mis à jour avec succès.');
                loadContextsForQuestion(currentQuestionID); // Recharge le tableau des contextes
            },
            error: function(xhr, status, error) {
                console.error('Erreur lors de la mise à jour du contexte:', error);
            }
        });
    }
    
    
    
    function deleteContext(contextID) {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce contexte ?')) {
            $.ajax({
                url: '/tables/QUEST_CTXT/' + contextID,
                method: 'DELETE',
                success: function(response) {
                    alert('Contexte supprimé avec succès.');
                    loadContextsForQuestion(currentQuestionID); // Recharge le tableau des contextes
                },
                error: function(xhr, status, error) {
                    console.error('Erreur lors de la suppression du contexte:', error);
                }
            });
        }
    }
    

    function addContextToQuestion(questionID, contextID, value) {
        if (!questionID || !contextID || value === undefined) {
            alert("Tous les champs doivent être remplis pour ajouter un contexte.");
            return;
        }
    
        $.ajax({
            url: '/tables/QUEST_CTXT', // URL de votre API pour ajouter des données à la table QUEST_CTXT
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                TSECIDRef: currentTSECID,
                QuestIDRef: questionID,
                ContextIDRef: contextID,
                Value: value

            }),
            success: function(response) {
                alert('Contexte ajouté avec succès.');
                // Actualiser l'affichage des contextes liés à la question
                loadContextsForQuestion(questionID);
            },
            error: function(xhr, status, error) {
                console.error('Erreur lors de l\'ajout du contexte:', error);
                alert('Erreur lors de l\'ajout du contexte: ' + error);
            }
        });
    }
    
    
    function useQuestion(selectedQuestionID) {
        $('#contextInterface').empty();
        prepareContextAdditionInterface(selectedQuestionID, function() {
            loadContextsForQuestion(selectedQuestionID);
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


    // Fonction pour afficher le formulaire de modification du groupe
    function showEditGroupForm(groupId) {
        // Premièrement, récupérer les métadonnées de la table pour connaître les champs à générer et leur type
        $.ajax({
            url: '/table-columns/GROUP_QUESTIONS',
            method: 'GET',
            success: function(columns) {
                $.ajax({
                    url: '/tables/GROUP_QUESTIONS/' + groupId,
                    method: 'GET',
                    success: function(groupData) {
                        var formHtml = '<form id="editGroupForm">';
                        columns.forEach(function(column) {
                            // Vérifie si le champ est une clé primaire (PRI) ou une clé étrangère (MUL)
                            var isDisabled = column.Key === 'PRI' || column.Key === 'MUL';
                            var disabledAttribute = isDisabled ? ' disabled ' : '';
                            var value = groupData[column.Field] || '';
    
                            formHtml += '<label for="' + column.Field + '">' + column.Field + ':</label>' +
                                        '<input type="text" name="' + column.Field + '" value="' + value + '"' + disabledAttribute + '><br>';
                        });
                        formHtml += '<button type="submit">Sauvegarder les modifications</button>';
                        formHtml += '<button type="button" id="deleteGroupButton">Supprimer le groupe</button>';
                        formHtml += '</form>';
    
                        $('#table-data').html(formHtml); // Affiche le formulaire
    
                        // Gérer la soumission du formulaire
                        $('#editGroupForm').on('submit', function(e) {
                            e.preventDefault();
                            var formData = $(this).serializeArray().reduce(function(obj, item) {
                                obj[item.name] = item.value;
                                return obj;
                            }, {});
                            updateGroupData(groupId, formData); // Envoie les modifications
                        });
    
                        // Gérer l'événement de clic sur le bouton de suppression
                        $('#deleteGroupButton').on('click', function() {
                            if (confirm("Êtes-vous sûr de vouloir supprimer ce groupe ?")) {
                                deleteGroup(groupId);
                            }
                        });
                    },
                    error: function(error) {
                        console.error("Erreur lors du chargement des données du groupe : ", error);
                    }
                });
            },
            error: function(xhr, status, error) {
                console.error('Erreur lors de la récupération des métadonnées:', error);
            }
        });
    }
    
    // Fonction pour supprimer un groupe
    function deleteGroup(groupId) {
        $.ajax({
            url: '/tables/GROUP_QUESTIONS/' + groupId,
            method: 'DELETE',
            success: function(response) {
                console.log('Groupe supprimé avec succès:', response);
                alert('Le groupe a été supprimé avec succès !');
                // Actions supplémentaires après la suppression du groupe (par exemple, rafraîchir les données affichées)
            },
            error: function(xhr, status, error) {
                console.error('Erreur lors de la suppression du groupe:', error);
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

    function clearLocalStorage() {
        localStorage.removeItem('selectedTSECID');
        localStorage.removeItem('selectedTSECName');
    }
    
    // Gérer l'événement de fermeture de l'application
    $(window).on('beforeunload', function() {
        clearLocalStorage();
    });
    

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

    $(document).on('click', '.option[data-table="QUESTIONS"][data-option="load-update"]', function() {
        loadQuestionsForUpdateAndEdit(); // Appelle une fonction pour charger et afficher les questions
    });

    loadTables();

});