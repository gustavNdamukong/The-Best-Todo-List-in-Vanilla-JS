const date = new Date();
const day = date.getDate();
const month = date.getMonth();
const year = date.getFullYear();


const ul = document.querySelector('#ul');
const form = document.querySelector('#form');
const input = document.querySelector('#input');
const submit = document.querySelector('#submit');
const alertError = document.querySelector('#alert');
const clearBtn = document.querySelector('#clearBtn');

//category creation fields
const catToggleBtn = document.querySelector('#toggleCatDiv');
const catInputDiv = document.querySelector('#catInputDiv');
const catForm = document.querySelector('#catForm');
const catSelectField = document.querySelector('#catSelectField');
const catInput = document.querySelector('#catInput');

//category editing fields
const mngCatToggleBtn = document.querySelector('#toggleManageCatDiv');
const mngCatDiv = document.querySelector('#mngCatDiv');
const mngCatUl = document.querySelector('#mngCatUl');

const LOCAL_STORAGE_TODO_KEY = 'nlm.todoList';
const LOCAL_STORAGE_TODO_CAT_KEY = 'nlm.todoListCat';
const LOCAL_STORAGE_TODO_DEFO_CAT_KEY = 'nlm.todoListDefaultCat';

//an array to hold all current todoList items (localStorage is nothing but objs in an array)
let stuffTodo = [];
//a variable to hold the current category.We need to get its val from the default cat in the localStorage
let currentCat = JSON.parse(localStorage.getItem(LOCAL_STORAGE_TODO_DEFO_CAT_KEY)) == null? 0 : JSON.parse(localStorage.getItem(LOCAL_STORAGE_TODO_DEFO_CAT_KEY)).id;



loadEventListeners();


function loadEventListeners() 
{
	form.addEventListener("submit", addTodo);
	ul.addEventListener('click', manageList);
	clearBtn.addEventListener('click', clearTodos);
	catToggleBtn.addEventListener('click', toggleCatForm);
	mngCatToggleBtn.addEventListener('click', toggleMngCatForm);
	catForm.addEventListener('submit', addCategory);
	catSelectField.addEventListener('change', changeCategory);
	mngCatUl.addEventListener('click', manageCatList);
}

//pull in the existing categories
loadCats()


function loadCats() {
	//if there are previously saved todoListCategories, grab them and display them in the categories drop down
	//While we are at it, we need to insert all the existing cats we have found in the mngCatUl list so they are ready for editing
	if (JSON.parse(localStorage.getItem(LOCAL_STORAGE_TODO_CAT_KEY)) !== null) {
		JSON.parse(localStorage.getItem(LOCAL_STORAGE_TODO_CAT_KEY)).map(todoCatFromStorage => {
			const optionElement = document.createElement('option');
			optionElement.innerHTML = todoCatFromStorage.category;

			if (currentCat == todoCatFromStorage.id)
			{
				Object.assign(optionElement, {
					value: todoCatFromStorage.id,
					selected : 'selected'
				});
			}
			else
			{
				Object.assign(optionElement, {
					value: todoCatFromStorage.id
				});
			}

			catSelectField.appendChild(optionElement);
			if (currentCat == 0)
			{
				currentCat = todoCatFromStorage.id;
			}


			const catLi = document.createElement('li');

			let mngCatString = "";

			mngCatString = `
		<div>
		<span class='cat-item'>${todoCatFromStorage.category}</span>
		<button name='deleteCatButton' id="deleteCatButton${todoCatFromStorage.id}" title="Delete this this category" class='deleteCatButton'>Delete</button>
		<button name='editCatButton' id='${todoCatFromStorage.id}' title="Edit this category" class='editCatButton'>Edit</button>
		<div class='editCatDiv' id='editCatFormDiv${todoCatFromStorage.id}'>
			<form class='editCatForm' onSubmit="saveCatEdit(event)">
				<input type='text' class='form-control' name='editCatField' /> 
			<a onClick='cancelCatEdit(event)' title="Cancel" class='btn btn-danger-sm cancelCatEdit'>x</a>
			<input type='submit' title="Save your edit" class='form-control btn btn-primary-sm editCatValue editCatInput' value='Save'>
			</form>
		</div>
		</div>
		`;

			catLi.innerHTML = mngCatString;

			catLi.classList.add('cat-list-item');

			mngCatUl.appendChild(catLi);
		});
	}
	else
	{
		alert('You dont have a todo category, create one first');
	}
}


showTodos(currentCat)




function showTodos(currentCategory) {
	//Its necessary to update the currentCategory here
	currentCat = currentCategory;

	//manage displaying of existing todoList items to the user. You get the data from localStorage
	//if there are previously saved todoList items, grab them
	if (JSON.parse(localStorage.getItem(LOCAL_STORAGE_TODO_KEY)) !== null) {
		//clear the currently displayed todoList items in the browser so we pass it only items in the current cat
		ul.innerHTML = "";
		JSON.parse(localStorage.getItem(LOCAL_STORAGE_TODO_KEY)).map(todoFromStorage => {
			if (todoFromStorage.categoryId == currentCategory) {
				const li = document.createElement('li');

				let todoString = "";

				todoString = `
		<div>
		<span class='todo-item'>${todoFromStorage.name}</span>
		<button name='deleteButton' id="deleteButton${todoFromStorage.id}" title="Delete this todo item" class='deleteButton'>Delete</button>
		<button name='editButton' id='${todoFromStorage.id}' title="Edit this todo item" class='editButton'>Edit</button>
		<input type='checkbox' title="Mark this item as done" name='checkButton' class='checkButton' />
		<div class='editDiv' id='editFormDiv${todoFromStorage.id}'>
			<form class='editForm' onSubmit="saveEdit(event)"><input type='text' class='form-control' name='editField' />  
			<a onClick='cancelEdit(event)' title="Cancel" class='btn btn-danger-sm cancelEdit'>x</a>
			<input type='submit' title="Save your edit" class='form-control btn btn-primary-sm editValue editInput' value='Save'>
			</form>
		</div>
		</div>
		`;

				li.innerHTML = todoString;


				Object.assign(li, {
					'draggable': 'true',
					className: ['list-item draggable']
				});

				ul.appendChild(li);


				if (ul.children.length > 1) {
					showClearBtn();
				} else {
					hideClearBtn();
				}
			}
		});
	}


	//NOTE: The following 3 blocks of code to select the draggable items (todoList items), and then add the dragstart, dragend, and dragover event listeners to them is all
	// done inside the addTodo() function because this is where the todoList li items are being created dynamically and assigned the right classes. Running this code
	// outside of the addTodo() func will cause errors because u would be trying to add event listeners to elems that do not yet exist.
	/*--------------------DRAG N DROP CODE---------------------*/
	const draggables = document.querySelectorAll('.draggable');

	draggables.forEach(draggable => {
		draggable.addEventListener('dragstart', () => {
			//apply a class so we know when an elem is being dragged
			draggable.classList.add('dragging');
		});

		draggable.addEventListener('dragend', () => {
			//remove the dragging class coz we've dropped the elem
			draggable.classList.remove('dragging');

			//------------------------SORTING----
			//For the sorting to be persisted, it needs to be done in the localStorage as well. The sorting in the localStorage is controlled by the the indexes of the todoList array
			//We just have to make sure the order of those indexes match the new order of the items in the browser.
			let allTodos = [];
			let todosInThisCat = document.querySelectorAll(".list-item");
			//loop thru each item in the browser and get their ID, then loop thru all todoList items in storage wh are not part of list in browser n store in an array,
			// then add to that array the things in this browser list coz they only belong to the current category

			let idsOfTodosInCurrentCat = [];

			//get all todos in current cat
			todosInThisCat.forEach(item_line => {
				//get the ID of each todoList item currently displayed in this cat. The IDs are same as the IDs of the 'editButton' (3rd elem in each todoList item div)
				//convert the ID from the browser to integers to match accurately
				idsOfTodosInCurrentCat.push(parseInt(item_line.children[0].children[2].getAttribute('id')));
			});

			//get all todos (from localStorage) not in current cat
			JSON.parse(localStorage.getItem(LOCAL_STORAGE_TODO_KEY)).map(todoFromStorage1 => {
				if (idsOfTodosInCurrentCat.includes(todoFromStorage1.id) === false) {
					allTodos.push(todoFromStorage1);
				}
			});


			idsOfTodosInCurrentCat.forEach(itemId => {
				//loop thru existing todoList items from storage and check which matches a currently displayed todoList item
				JSON.parse(localStorage.getItem(LOCAL_STORAGE_TODO_KEY)).map(todoFromStorage2 => {
					if (itemId === todoFromStorage2.id) {
						allTodos.push(todoFromStorage2);
					}
				});
			});

			//re-save the re-ordered todoList data in the localStorage
			localStorage.setItem(LOCAL_STORAGE_TODO_KEY, JSON.stringify(allTodos));
		});
	});


	//need to add an event listener to whatever the drop spot is going to be (in this case it's the ul)
	ul.addEventListener('dragover', e => {
		//determine which specific element is being dragged at any given point in time. There can only be one at a time
		const afterElement = getDragAfterElement(ul, e.clientY);
		const draggable = document.querySelector('.dragging');

		if (afterElement == null) {
			//this is the last item in the container so place it beneath
			ul.appendChild(draggable);
		} else {
			ul.insertBefore(draggable, afterElement);
		}

		e.preventDefault(); //to enable dropping inside of an elem (its disabled by default)
	});
	/*---------------------------END DRAG N DROP---------------------*/
}





function changeCategory(e)
{
	let cat = e.target.value;
	//get the cat ID which is the value attr of the selected option
	let catValueAttr = e.target.options[e.target.selectedIndex].value;
	//need to save the new cat as the defo cat in localStorage
	let defCat = {
		id: catValueAttr
	}
	localStorage.setItem(LOCAL_STORAGE_TODO_DEFO_CAT_KEY, JSON.stringify(defCat));
	showTodos(catValueAttr);
}



function hideClearBtn() {
	clearBtn.style.display = "none";
}


/**
 * We will clear only todoList items that belong to the current active category
 * @param e
 */
function clearTodos(e) {
	//let them confirm if they really wanna clear everything
	if (window.confirm('Are you sure you want to clear all todos in this category?')) {
		//First of all, clear the data from localStorage if there is any
		if (JSON.parse(localStorage.getItem(LOCAL_STORAGE_TODO_KEY)) !== null)
		{
			let itemsLocal = [];
			JSON.parse(localStorage.getItem(LOCAL_STORAGE_TODO_KEY)).map(todoFromStorage => {
				if (todoFromStorage.categoryId != currentCat) {
					itemsLocal.push(todoFromStorage);
				}
			});

			//reset localStorage todoList data or delete it if it's empty
			if (itemsLocal.length != 0) {
				localStorage.setItem(LOCAL_STORAGE_TODO_KEY, JSON.stringify(itemsLocal));
			}
			else
			{
				localStorage.removeItem(LOCAL_STORAGE_TODO_KEY);
			}
		}

		const list = document.querySelectorAll(".list-item");
		list.forEach(item => {
			item.remove();
		});

		hideClearBtn();
	}
	e.preventDefault();
}




function toggleCatForm(e) {
	if (catInputDiv.style.display == 'block') {
		catInputDiv.style.display = 'none';
		catToggleBtn.innerHTML = "Create new Category";
	}
	else
	{
		catInputDiv.style.display = 'block';
		catToggleBtn.innerHTML = "Hide category form";
	}
	e.preventDefault();
}




function toggleMngCatForm(e) {
	if (mngCatDiv.style.display == 'block') {
		mngCatDiv.style.display = 'none';
		mngCatToggleBtn.innerHTML = "Manage Categories";
	}
	else
	{
		mngCatDiv.style.display = 'block';
		mngCatToggleBtn.innerHTML = "Hide category edit form";
	}
	e.preventDefault();
}






function showError(message)
{
	alertError.children[0].innerHTML = message;
	alertError.style.display = 'block';

	setTimeout(() => {
		alertError.children[0].innerHTML = "";
		alertError.style.display = 'none';
	}, 3000);
}




function manageList(e) 
{
	if (e.target.name == 'checkButton') 
	{
		markTodoAsDone(e);
	}

	if (e.target.name == 'editButton') 
	{
		editTodo(e);
	}
	
	if (e.target.name == 'deleteButton') 
	{
		deleteTodo(e);
	}
}



function manageCatList(e)
{
	if (e.target.name == 'editCatButton')
	{
		editCategory(e);
	}

	if (e.target.name == 'deleteCatButton')
	{
		deleteCategory(e);
	}
}



function showClearBtn() 
{
	clearBtn.style.display = 'inline-block';
}





function addCategory(e)
{
	let newCategory = catInput.value;

	//do some validation against blank category submissions
	if (newCategory == '')
	{
		alertError.children[0].innerHTML = "Please type in a category name!";
		alertError.style.display = 'block';

		setTimeout(() => {
			alertError.children[0].innerHTML = "";
			alertError.style.display = 'none';
		}, 2000);

	}
	else {
		//save it in the localStorage
		//get the ID to be used for the ingoing todoList category
		let catUniqueId = getCatId();
		//an array to hold all the cat objects (localStorage is nothing but objs in an array)
		let catArray = [];

		let catObject = {
			id: catUniqueId,
			category: newCategory
		}

		//create the default cat object
		let defoCatObj = {
			id: catUniqueId
		}

		//clear the cat just submitted from the input field
		catInput.value = "";

		//Check in the localStorage for todoList cats already saved there
		//if there's nothing in storage, use what user has submitted
		if (JSON.parse(localStorage.getItem(LOCAL_STORAGE_TODO_CAT_KEY)) === null) {
			catArray.push(catObject);
			//then save it in storage
			localStorage.setItem(LOCAL_STORAGE_TODO_CAT_KEY, JSON.stringify(catArray));

			//set the default category in storage
			localStorage.setItem(LOCAL_STORAGE_TODO_DEFO_CAT_KEY, JSON.stringify(defoCatObj));

			//refresh page so the landing page part of the code gets the updated list
			window.location.reload();
		} else {
			let found = [];
			//there are items already saved in storage, so grab them n add to the array to be saved (this is coz when saving anything to localStorage, prev data is overridden)
			JSON.parse(localStorage.getItem(LOCAL_STORAGE_TODO_CAT_KEY)).map(todoCatFromStorage => {
				//push in all cats from local storage into our array as well as the new todoList cat the user just submitted
				//but while you are at it, make sure that cat name has not been registered before
				if (todoCatFromStorage.category === newCategory)
				{
					found.push(todoCatFromStorage.category);
				}
				catArray.push(todoCatFromStorage);
			});
			//push in the newly submitted cat as well
			catArray.push(catObject);
			//if that new cat already exists, do nothing, else save it
			if (found.length > 0)
			{
				let msg = "That category name already exists!";
				showError(msg);
			}
			else {
				//save them all to the localStorage again
				localStorage.setItem(LOCAL_STORAGE_TODO_CAT_KEY, JSON.stringify(catArray));

				//set the default category in storage  ly
				localStorage.setItem(LOCAL_STORAGE_TODO_DEFO_CAT_KEY, JSON.stringify(defoCatObj));

				//refresh page so the landing page part of the code gets the updated list
				window.location.reload();
			}
		}
	}
	e.preventDefault();
}






function addTodo(e) 
{
	//get the todoList item submitted by user
	const somethingTodo = input.value;
	//do some validation for blank submissions and todoList items submitted with no categories
	if (somethingTodo == '')
	{
		alertError.children[0].innerHTML = "Please type in something!";
		alertError.style.display = 'block';

		setTimeout(() => {
			alertError.children[0].innerHTML = "";
			alertError.style.display = 'none';
		}, 3000);

	}
	//Check in the localStorage has no categories saved there, & warn the user to create a cat first if there's none
	else if (JSON.parse(localStorage.getItem(LOCAL_STORAGE_TODO_CAT_KEY)) === null)
	{
		alertError.children[0].innerHTML = "Please create a category first!";
		alertError.style.display = 'block';

		setTimeout(() => {
			alertError.children[0].innerHTML = "";
			alertError.style.display = 'none';
		}, 3000);
	}
	else
	{
		//get the ID to be used for the ingoing todoList Item
		let id = getId();

		//create an object to hold the todoList item
		let somethingTodoObj = {
			id: id,
			name: somethingTodo,
			categoryId: currentCat,
			date: day+'-'+month+'-'+year
		};

		//clear the item just submitted from the input field
		input.value = "";

		//Check in the local storage for todoList items already saved there
		//if there's nothing in storage, use what user has submitted
		if (JSON.parse(localStorage.getItem(LOCAL_STORAGE_TODO_KEY)) === null)
		{
			//clear the currently displayed todos in the browser
			stuffTodo = [];
			stuffTodo.push(somethingTodoObj);
			//then save it in storage
			localStorage.setItem(LOCAL_STORAGE_TODO_KEY, JSON.stringify(stuffTodo));

			//refresh page so the landing page part of the code gets the updated list
			window.location.reload();
		}
		else
		{
			//there are items already saved in storage, so grab them n add to the array to be saved (this is coz when saving anything to localStorage, prev data is overridden)
			JSON.parse(localStorage.getItem(LOCAL_STORAGE_TODO_KEY)).map(todoFromStorage => {
					//push in all items from local storage into our array as well as the new todoList item the user just submitted
					stuffTodo.push(todoFromStorage);
			});
			//push in the newly submitted todoList item as well
			stuffTodo.push(somethingTodoObj);

			//save them all to the local storage again
			localStorage.setItem(LOCAL_STORAGE_TODO_KEY, JSON.stringify(stuffTodo));

			//refresh page so the landing page part of the code gets the updated list
			window.location.reload();
		}
	}
	e.preventDefault();
}




function getId()
{
	if ((JSON.parse(localStorage.getItem(LOCAL_STORAGE_TODO_KEY)) === null) || (JSON.parse(localStorage.getItem(LOCAL_STORAGE_TODO_KEY)).length == 0))
	{
		return 1;
	}
	else
	{
		//JSON.parse() returns an array, so get the ID of the last elem and increment it by 1
		let IdNum = parseInt(JSON.parse(localStorage.getItem(LOCAL_STORAGE_TODO_KEY))[JSON.parse(localStorage.getItem(LOCAL_STORAGE_TODO_KEY)).length - 1].id);
		let idFigure = IdNum + 1;
		return idFigure;
	}
}





function getCatId()
{
	if ((JSON.parse(localStorage.getItem(LOCAL_STORAGE_TODO_CAT_KEY)) === null) || (JSON.parse(localStorage.getItem(LOCAL_STORAGE_TODO_CAT_KEY)).length == 0))
	{
		return 1;
	}
	else
	{
		//JSON.parse() returns an array, so get the ID of the last elem and increment it by 1
		let CatIdNum = parseInt(JSON.parse(localStorage.getItem(LOCAL_STORAGE_TODO_CAT_KEY))[JSON.parse(localStorage.getItem(LOCAL_STORAGE_TODO_CAT_KEY)).length - 1].id);
		let newCatId = CatIdNum + 1;
		return newCatId;
	}
}


/*---------------------DRAG N DROP FUNC---------------------------*/
/**
 * this func will determine the position of the mouse on the y-axis and return which elem the mouse is directly after
 * first, determine all the elems inside the container
 * we create a var draggableElems to store all the elems in the container as an array. The spread operator (...) converts what is returned by querySelectorAll() into an array
 * so that we can perform array operations on it. It basically spreads it out into a new array
 */
function getDragAfterElement(container, y) {
	//Also, we do not want to include in that array the elem being dragged, hence the :not(.dragging) filter.
	const draggableElems = [...container.querySelectorAll('.draggable:not(.dragging)')];
	return draggableElems.reduce((closest, child) => {
			const box = child.getBoundingClientRect();
			const offset = y - box.top - box.height / 2;

			//if the number is positive, then we are below the element, if negative, then we are above it. We only care about negative numbers because
			// it means we are currently hovering over the elem ie < 0
			if (offset < 0 && offset > closest.offset)
			{
				return { offset: offset, element: child }
			}
			else
			{
				//offset is greater than 0 or less than closest.offset
				return closest;
			}
		}, { offset: Number.NEGATIVE_INFINITY }).element;
}
/*---------------------END OF DRAG N DROP FUNCS----------------------*/




function markTodoAsDone(e)
{
	let item = e.target.parentNode;
	if (item.style.textDecoration == 'line-through')
	{
		item.style.textDecoration = 'none';
	}
	else
	{
		item.style.textDecoration = 'line-through';
	}
}




function editTodo(e)
{
	//grab the ID of the edit button just clicked
	let editBtnId = e.target.id;

	//grab the edit form that matches the ID of the edit button just clicked 
	let editDiv = document.getElementById('editFormDiv'+editBtnId);
	editDiv.style.display = 'block';
}




function cancelEdit(e)
{
	//grab the edit form's parent div
	let parentDiv = e.target.parentNode.parentNode;

	//hide the form div
	parentDiv.style.display = 'none';
	e.preventDefault();
}




function saveEdit(e)
{
	//grab the edit form's parent div
	let editFormDiv = e.target.parentNode;
	let todoId = parseInt((editFormDiv.id).split('editFormDiv')[1]);

	let savedValue = e.target.children[0].value;
	if (savedValue != '')
	{
		let itemsLocal = [];
		//grab all existing todoList items from storage except the one being edited
		JSON.parse(localStorage.getItem(LOCAL_STORAGE_TODO_KEY)).map(todoFromStorage => {
			//get the matching todoList item by ID and update its text
			if (todoFromStorage.id == todoId) {
				todoFromStorage.name = savedValue;
				itemsLocal.push(todoFromStorage);
			}
			else
			{
				itemsLocal.push(todoFromStorage);
			}
		});

		//reset localStorage todoList data
		localStorage.setItem(LOCAL_STORAGE_TODO_KEY, JSON.stringify(itemsLocal));

		let todoParent = e.target.parentNode.parentNode;
		//get the the first element inside the parent li item, which is the span containing the 
			//todoList item value and replace its value with the new one
		let todoItem = todoParent.children[0];
		todoItem.innerHTML = savedValue;

		//hide the form div again
		editFormDiv.style.display = 'none';
	}
	else
	{
		alert('You did not enter anything!');
	}
	e.preventDefault();
}




function deleteTodo(e)
{
	//get the todoList item ID from the delete button that was clicked
	let delId = (e.target.id).split('deleteButton')[1];

	if (JSON.parse(localStorage.getItem(LOCAL_STORAGE_TODO_KEY)) !== null)
	{
		let itemsLocal = [];
		JSON.parse(localStorage.getItem(LOCAL_STORAGE_TODO_KEY)).map(todoFromStorage => {
			if (todoFromStorage.id != delId) {
				itemsLocal.push(todoFromStorage);
			}
		});

		//reset localStorage todoList data or delete it if it's empty
		if (itemsLocal.length != 0) {
			localStorage.setItem(LOCAL_STORAGE_TODO_KEY, JSON.stringify(itemsLocal));
		}
		else
		{
			localStorage.removeItem(LOCAL_STORAGE_TODO_KEY);
		}
	}

	//get rid of the <li> elem in the browser
	let item = e.target.parentNode.parentNode;

	item.addEventListener('transitionend', () => {
		item.remove();

		//check if the todoList items are less than two and hide the clear all button
		if (ul.children.length < 2)
		{
			hideClearBtn();
		}
	});

	item.classList.add('todo-list-item-fall');
}






//MANAGE CATEGORIES

function editCategory(e)
{
	//grab the ID of the edit button just clicked
	let editCatBtnId = e.target.id;

	//grab the edit form that matches the ID of the edit button just clicked
	let editCatDiv = document.getElementById('editCatFormDiv'+editCatBtnId);
	editCatDiv.style.display = 'block';
}



function cancelCatEdit(e)
{
	//grab the edit form's parent div
	let parentCatDiv = e.target.parentNode.parentNode;

	//hide the form div
	parentCatDiv.style.display = 'none';
	e.preventDefault();
}





function saveCatEdit(e)
{
	//grab the edit form's parent div
	let editCatFormDiv = e.target.parentNode;
	let todoCatId = parseInt((editCatFormDiv.id).split('editCatFormDiv')[1]);

	let savedCatValue = e.target.children[0].value;

	if (savedCatValue != '')
	{
		let catsLocal = [];
		//grab all existing cats from storage except the one being edited
		JSON.parse(localStorage.getItem(LOCAL_STORAGE_TODO_CAT_KEY)).map(todoCatFromStorage => {
			//get the matching cat by ID and update its text
			if (todoCatFromStorage.id == todoCatId) {
				todoCatFromStorage.category = savedCatValue;
				catsLocal.push(todoCatFromStorage);
			}
			else
			{
				catsLocal.push(todoCatFromStorage);
			}
		});

		//reset localStorage todoList data
		localStorage.setItem(LOCAL_STORAGE_TODO_CAT_KEY, JSON.stringify(catsLocal));

		let todoCatParent = e.target.parentNode.parentNode;
		//get the the first element inside the parent li item, which is the span containing the
		//todoList item value and replace its value with the new one
		let todoCatItem = todoCatParent.children[0];
		todoCatItem.innerHTML = savedCatValue;

		//hide the form div again
		editCatFormDiv.style.display = 'none';
	}
	else
	{
		alert('You did not enter anything!');
		return false;
	}
	e.preventDefault();

	window.location.reload();
}





function deleteCategory(e)
{
	//Warn the user that all todoList items under this category will be lost
	if (window.confirm('Are you sure? Removing this category will clear all todos associated with it!')) {
		//get the todoList item cat ID from the delete button that was clicked
		let delCatId = (e.target.id).split('deleteCatButton')[1];

		//Loop thru all cats retrieving all except the cat to be deleted, then rewrite the cats to storage without the deleted one.
		// Finally, loop thru all existing todos n do the same for those having a cat ID matching this one b4 rewriting them to storage.
		//CLEAR FROM CATS
		if (JSON.parse(localStorage.getItem(LOCAL_STORAGE_TODO_CAT_KEY)) !== null) {
			let localCatItems = [];
			//we need a new default cat
			let newDefaultCat = {
				id: 0
			}
			JSON.parse(localStorage.getItem(LOCAL_STORAGE_TODO_CAT_KEY)).map(todoCatFromStorage => {
				if (todoCatFromStorage.id != delCatId) {
					localCatItems.push(todoCatFromStorage);
					newDefaultCat.id = todoCatFromStorage.id;
				}
			});

			//reset localStorage todoList category data or delete it if it's empty
			if (localCatItems.length != 0) {
				localStorage.setItem(LOCAL_STORAGE_TODO_CAT_KEY, JSON.stringify(localCatItems));
			} else {
				localStorage.removeItem(LOCAL_STORAGE_TODO_CAT_KEY);
			}

			//reset localStorage default cat
			//if that was the last cat, clear the last default cat from localStorage, else reset it
			if (newDefaultCat.id == 0)
			{
				localStorage.removeItem(LOCAL_STORAGE_TODO_DEFO_CAT_KEY);
			}
			else
			{
				localStorage.setItem(LOCAL_STORAGE_TODO_DEFO_CAT_KEY, JSON.stringify(newDefaultCat));
			}
		}

		//CLEAR FROM TODOS
		if (JSON.parse(localStorage.getItem(LOCAL_STORAGE_TODO_KEY)) !== null) {
			let localTodoItems = [];
			JSON.parse(localStorage.getItem(LOCAL_STORAGE_TODO_KEY)).map(todoFromStorage => {
				if (todoFromStorage.categoryId != delCatId) {
					localTodoItems.push(todoFromStorage);
				}
			});

			//reset localStorage todoList data or delete it if it's empty
			if (localTodoItems.length != 0) {
				localStorage.setItem(LOCAL_STORAGE_TODO_KEY, JSON.stringify(localTodoItems));
			} else {
				localStorage.removeItem(LOCAL_STORAGE_TODO_KEY);
			}
		}

		window.location.reload();
	}
}

