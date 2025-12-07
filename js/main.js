'use strict';
/*===============================================================
         Scripts for the preloader
==================================================================*/
$(document).ready(function () {
   console.log('document is ready in jQuery!');
   $('#preloader-gif, #preloader').fadeOut(5000, function () {});

});
/*===============================================================
         Scripts for the tw-simple-todo-app
==================================================================*/
document.addEventListener('DOMContentLoaded', () => {
   console.log('document is ready in plain JavaScript!');
   let localToDoList = getInitialTodoList();

   /************************* variables *************************/
   const addButton = document.getElementById('add-button');
   const addInput = document.getElementById('add-input');
   const toDoList = document.getElementById('list');
   const counter = document.getElementById('counter');
   const maxLength = addInput.getAttribute('maxlength');
   const windowScreen = window.screen.availWidth;

   let isEditing = false;
   let editID = '';
   let editItem;
   let editItemText;
   let editItemIsChecked = false;

   let draggedItem = null;

   if (navigator.storage && navigator.storage.persisted) {

      navigator.storage.persisted().then((wellWasIt) => {
         if (!wellWasIt) {
            console.log('WellWasIt is not supported and is set to', wellWasIt);
         }
         navigator.storage.persist().then((allowed) => {
            if (!allowed) {
               allowed = true
               console.log('Persisted storage is set to', allowed);
            }
         });
      });
   }

   if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().then((persistent) => {
         if (persistent) {
            console.log('Storage will not be cleared except by explicit user action');

         } else {
            console.log('Storage may be cleared by the UA under storage pressure.');

         }
      });
   }

   if (windowScreen <= 320) {
      addInput.setAttribute('maxlength', '24');
      counter.innerText = '24';

   } else {
      addInput.setAttribute('maxlength', '28');
      counter.innerText = '28';

   }

   /************************* functions *************************/
   /**
    * @description - adds a todoItem to the toDoList with clicking the addButton
    * @param e - the click event of the addButton
    */
   function addTodoItem(e) {
      e.preventDefault();
      let inputValue = addInput.value.trim();
      const id = self.crypto.randomUUID();
      let isChecked = false;

      if (inputValue && !isEditing) {
         createListItem(id, inputValue, isChecked);
         addTodoItemToLocalStorage(id, inputValue, isChecked);
         setToDefaultSettings();

      } else if (inputValue && isEditing) {
         editItem.innerHTML = inputValue;
         updateEditTodoItemToLocalStorage(editID, inputValue, editItemIsChecked);
         updateIsCheckedToLocalStorage(editID, editItemIsChecked);
         setToDefaultSettings();

         swal('Your todo item was successfully edited!', {
            icon: 'success'
         });

      } else {
         swal('Invalid Entry', 'Enter A Valid Entry!', 'error');
      }

   }//end of addTodoItem function

   /**
    * @description - adds a todoItem to the toDoList with pressing the enter key
    * @param e - the keydown event of input[type=text]
    */
   function addTodoItemWithEnterKey(e) {
      if (e.keyCode === 13) {
         let inputValue = addInput.value.trim();
         const id = self.crypto.randomUUID();
         let isChecked = false;

         if (inputValue && !isEditing) {
            let attribute = document.createAttribute('data-id');
            attribute.value = id;
            isChecked = hasClass('input.checkbox', 'completed');

            createListItem(id, inputValue, isChecked);
            addTodoItemToLocalStorage(id, inputValue, isChecked);
            setToDefaultSettings();

         } else if (inputValue && isEditing) {
            editItem.innerHTML = inputValue.trim();

            updateEditTodoItemToLocalStorage(
               editID,
               inputValue.trim(),
               editItemIsChecked
            );
            updateIsCheckedToLocalStorage(editID, editItemIsChecked);
            setToDefaultSettings();

            swal('Your todo item was successfully edited!', {
               icon: 'success'
            });

         } else {
            swal('Invalid Entry', 'Enter A Valid Entry!', {
               icon: 'error'
            });

         }
      }

   }//end of addToDoItemWithEnterKey Function

   /**
    * @description - adds the text content of the todoItem to the input[type=text] for
    * editing
    * @param e - the click event of clicking the fa-edit icon
    */
   function editTodoItem(e) {
      if (e.target.classList.contains('fa-edit')) {
         const todoItem = e.target.parentElement.parentElement;
         editID = todoItem.dataset.id;
         let elem =
            e.target.parentElement.parentElement.childNodes[1].childNodes[0]
               .nextSibling;
         editItemIsChecked = hasClass(elem, 'completed');

         isEditing = true;
         addButton.innerText = 'Edit Item';
         editItem = e.target.parentNode.parentNode.querySelector('.item');
         editItemText = editItem.textContent;
         addInput.value = editItemText;
         getCharacterCount();
         addInput.focus();

      }

   }//end of editTodoItem Function

   /**
    * @description - deletes the todoItem from the toDoList
    * @param e - the click event of clicking the fa-trash-alt icon
    */
   function deleteTodoItem(e) {
      if (e.target.classList.contains('fa-trash-alt')) {
         swal({
            title: 'Are you sure?',
            text: 'Once deleted, impossible to recover!',
            icon: 'warning',
            buttons: true,
            dangerMode: true
         }).then(willDelete => {
            if (willDelete) {
               const todo = e.target.parentElement.parentElement;
               const id = todo.dataset.id;

               toDoList.removeChild(todo);
               setToDefaultSettings();
               removeTodoItemFromLocalStorage(id);

               swal('Your todo item has been deleted!', {
                  icon: 'success'
               });

            } else {
               swal('Your todo item is safe!', {
                  icon: 'info'
               });

            }
         });
      }

   }//end of deleteTodoItem Function

   /**
    * @description - toggles the completed class to the todoItem and calls function to
    * update completed status to localStorage
    * @param e - the click event of clicking the todoItem
    */
   function updateIsCheckedStatus(e) {
      const id = e.target.parentElement.parentElement.dataset.id;

      if (e.target.checked === true) {
         e.target.setAttribute('class', 'completed');
         updateIsCheckedToLocalStorage(id, true);

      } else {
         e.target.removeAttribute('class', 'completed');
         updateIsCheckedToLocalStorage(id, false);

      }
   }//end of updateIsCheckedStatus Function

   /**
    * @description - creates the list item for the toDoList
    * @param id - todoItem ID
    * @param todoItem - todoItem text content
    * @param isChecked - a boolean, whether the todoItem is completed or not
    */
   function createListItem(id, todoItem, isChecked) {
      let attribute = document.createAttribute('data-id');
      attribute.value = id;

      const template = document.querySelector('#template');
      const clone = document.importNode(template.content, true);
      clone.querySelector('.todo-item').setAttributeNode(attribute);
      clone.querySelector('.todo-item').setAttribute('draggable', 'true');
      clone.querySelector('.item').textContent = todoItem;
      clone
         .querySelector('.checkbox')
         .addEventListener('click', updateIsCheckedStatus);
      isChecked = clone
         .querySelector('.checkbox')
         .classList.contains('completed');
      clone.querySelector('.checkbox').checked = isChecked;

      toDoList.appendChild(clone);

   } //end of the createListItem function

   /**
    * @description - creates a todoItem that is to be displayed
    * @param id - the todoItem ID
    * @param todoItem - the todoItem text
    * @param isChecked - the checked/completed status of the todoItem
    */
   function createDisplayListItem(id, todoItem, isChecked) {
      let attribute = document.createAttribute('data-id');
      attribute.value = id;

      const template = document.querySelector('#template');
      const clone = document.importNode(template.content, true);
      clone.querySelector('.todo-item').setAttributeNode(attribute);
      clone.querySelector('.item').textContent = todoItem;
      clone
         .querySelector('.checkbox')
         .addEventListener('click', updateIsCheckedStatus);
      isChecked
         ? clone.querySelector('.checkbox').classList.add('completed')
         : clone.querySelector('.checkbox').classList.remove('completed');
      clone.querySelector('.checkbox').checked = isChecked;

      toDoList.appendChild(clone);

   } // end of createDisplayListItem function

   /**
    * @description - displays the toDoList
    */
   function displayTodoItems() {
      localToDoList = getLocalStorage();

      if (localToDoList.length > 0) {
         localToDoList.forEach(todo =>
            createDisplayListItem(todo.id, todo.todoItem, todo.isChecked));
      }

      localStorage.setItem('simple-toDoApp', JSON.stringify(localToDoList));

   } //end of displayTodoItems function

   /**
    * @description - get the data of the localStorage
    * @returns {any|*[]} - an array of todoItem Objects or an empty Array
    */
   function getInitialTodoList() {
      /************************* get the simple-toDoApp *************************/
      const localTodoList = localStorage.getItem('simple-toDoApp');

      /************************* parse simple-toDoApp to JSON format, if not empty *************************/
      if (localTodoList) {
         return JSON.parse(localTodoList);
      }

      /************************* localStorage is empty, set it to 'simple-toDoApp' *************************/
      localStorage.setItem('simple-toDoApp', []);
      return [];

   } //end of getInitialTodoList function

   /**
    * @description - gets the data of the localStorage
    * @returns {any|*[]} - an array of todoItem Objects or an empty Array
    */
   function getLocalStorage() {
      return localStorage.getItem('simple-toDoApp') ? JSON.parse(localStorage.getItem('simple-toDoApp')) : [];

   }//end of getLocalStorage function

   /**
    * @description - adds the todoItem to localStorage
    * @param id - the todoItem ID
    * @param todoItem - the todoItem text
    * @param isChecked - the checked/completed status of the todoItem
    */
   function addTodoItemToLocalStorage(id, todoItem, isChecked) {
      const todo = {
         id,
         todoItem,
         isChecked
      };

      let localStorageTodoListArr = getLocalStorage();
      localStorageTodoListArr.push(todo);

      localStorage.setItem('simple-toDoApp', JSON.stringify(localStorageTodoListArr));

   }//end of addTodoItemToLocalStorage Function

   /**
    * @description - removes todoItem from localStorage
    * @param id - todoItem ID
    */
   function removeTodoItemFromLocalStorage(id) {
      let localStorageTodoListArr = getLocalStorage();
      localStorageTodoListArr = localStorageTodoListArr.filter(todo => todo.id !== id);

      localStorage.setItem('simple-toDoApp', JSON.stringify(localStorageTodoListArr));

   }//end of removeTodoItemFromLocalStorage Function

   /**
    * @description - updates the completed state of the todoItem to localStorage
    * @param id - the todoItem ID
    * @param isChecked - true or false, whether the todoItem is completed
    */
   function updateIsCheckedToLocalStorage(id, isChecked) {
      let localToDoListArr = getLocalStorage();
      localToDoListArr = localToDoListArr.map(function (todo) {
         if (todo.id === id) {
            todo.isChecked = isChecked;
         }
         return todo;
      });

      localStorage.setItem('simple-toDoApp', JSON.stringify(localToDoListArr));

   } //end of updateIsCheckedToLocalStorage function

   /**
    * @description - updates the edited todoItem to the localStorage
    * @param id - the edited todoItem ID
    * @param todoItem - the edited todoItem text
    * @param isChecked - the checked/completed status of edited todoItem
    */
   function updateEditTodoItemToLocalStorage(id, todoItem, isChecked) {
      let localToDoListArr = getLocalStorage();
      localToDoListArr = localToDoListArr.map(todo => {
         if (todo.id === id) {
            todo.todoItem = todoItem;
            todo.isChecked = isChecked;

         }
         return todo;
      });

      localStorage.setItem('simple-toDoApp', JSON.stringify(localToDoListArr));

   } //end of updateEditTodoItemToLocalStorage function

   /**
    * @description - sets the default settings
    */
   function setToDefaultSettings() {
      addButton.innerText = 'Add Item';
      isEditing = false;
      editID = '';
      editItemIsChecked = false;

      setTimeout(() => {
         addInput.value = '';
         getCharacterCount();
      }, 250);
      addInput.focus();

   } //end of setToDefaultSettings function

   /**
    * @description - counts remaining character count for input[type=text]
    */
   function getCharacterCount() {
      let characterCount = maxLength - addInput.value.length;
      characterCount < 10 ? counter.innerText = `0${characterCount}` : counter.innerText = `${characterCount}`;

   } //end of the getCharacterCount function

   /**
    * @description - checks whether an element has a class or not
    * @param elem - the specified element
    * @param namedClass - the specified class name
    * @returns {boolean} - true if the element has the named class, otherwise,
    * returns false.
    */
   function hasClass(elem, namedClass) {
      return ('' + elem.className + '').indexOf('' + namedClass + '') > -1;

   } //end of hasClass function

   /**
    * @description - monitors the moving of the draggable element from the original
    * container to the drop zone
    * @param container - the original container
    * @param y - the vertical position
    * @returns {*} - offset to Number.NEGATIVE_INFINITY
    */
   function getDragAfterElement(container, y) {
      const draggableElements = [
         ...container.querySelectorAll('li:not(.dragging)')
      ];

      return draggableElements.reduce(
         (closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
               return {
                  offset: offset,
                  element: child
               };
            } else {
               return closest;
            }
         },
         {
            offset: Number.NEGATIVE_INFINITY
         }
      ).element;

   }//end of getDragAfterElement function

   /**
    * @description - monitors the start of dragging the draggable element
    * @param e - the event of dragstart
    */
   function handleDragStart(e) {
      draggedItem = e.target;

      setTimeout(() => {
         e.target.style.display = 'none';
      }, 0);

   }//end of handleDragStart function

   /**
    * @description - monitors the end of dragging the draggable element
    * @param e - the event of dragend
    */
   function handleDragEnd(e) {
      setTimeout(() => {
         e.target.style.display = '';
         draggedItem = null;
      }, 0);

   }//end of handleDragEnd function

   /**
    * @description - monitors when the dragging element is dragged over a valid drop
    * target
    * @param e - the event of dragover
    */
   function handleDragOver(e) {
      e.preventDefault();
      const afterElement = getDragAfterElement(toDoList, e.clientY);

      if (afterElement === null) {

         toDoList.appendChild(draggedItem);

      } else {
         toDoList.insertBefore(draggedItem, afterElement);

      }

   }//end of handleDragOver function

   /************************* event listeners *************************/
   window.addEventListener('DOMContentLoaded', getInitialTodoList);
   addButton.addEventListener('click', addTodoItem);
   addInput.addEventListener('keydown', addTodoItemWithEnterKey);
   addInput.addEventListener('keyup', getCharacterCount);
   toDoList.addEventListener('click', deleteTodoItem);
   toDoList.addEventListener('click', editTodoItem);
   toDoList.addEventListener('dragstart', handleDragStart);
   toDoList.addEventListener('dragend', handleDragEnd);
   toDoList.addEventListener('dragover', handleDragOver);

   displayTodoItems();


});

window.onload = function () {
   console.log('window is loaded in plain JavaScript!');
}