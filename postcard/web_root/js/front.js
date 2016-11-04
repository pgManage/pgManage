var list = document.querySelector('.todo-list');
var new_todo = document.querySelector('.new-todo');

function loadData() {
	postgresQuery('SELECT * FROM todo.ttodo ORDER BY id DESC', [], function (err, result) {
		if (err) {
			throw err;
		}

		while (list.firstChild) {
			list.removeChild(list.firstChild);
		}

		var i = 0, len = result.rowCount;
		console.log(result);
		for (; i < len; i += 1) {
			var li = document.createElement('li');
			var div = document.createElement('div');
			var input = document.createElement('input');
			var label = document.createElement('label');
			var button = document.createElement('button');

			input.type = 'checkbox';
			input.classList.add('toggle');
			input.checked = result.rows[i].complete === -1;
			input.id = result.rows[i].id;
			input.addEventListener('change', taskToggle);
			div.appendChild(input);

			label.innerText = result.rows[i].task;
			label.addEventListener('dblclick', taskEdit);
			div.appendChild(label);

			button.classList.add('destroy');
			button.id = result.rows[i].id;
			button.addEventListener('click', taskDelete);
			div.appendChild(button);

			div.classList.add('view');
			li.appendChild(div);

			li.label = label;
			label.li = li;
			li.id = result.rows[i].id;
			if (result.rows[i].complete === -1) {
				li.classList.add('completed');
			}

			list.appendChild(li);
		}
		updateCount();
	});
}

function updateCount() {
	if (list.childElementCount === 0) {
		document.querySelector('.footer').style.display = 'none';
	} else {
		postgresQuery('SELECT count(*) AS total, sum(CASE WHEN complete = -1 THEN 1 ELSE 0 END) AS completed FROM todo.ttodo', [], function (err, result) {
			if (err) {
				throw err;
			}
			var total = result.rows[0].total;
			var completed = result.rows[0].completed;
			var active = total - completed;

			document.querySelector('.toggle-all').checked = (total === completed);
			document.querySelector('.footer').style.display = 'block';
			document.querySelector('.todo-count').innerHTML =
				'<strong>' + active + '</strong> item' +
				(active === 1 ? '' : 's') + ' left';
		});
	}
}

function taskChange() {
	var self = this.parentNode,
		newValue = this.value,
		rowID = self.id;
	console.log(self, rowID, newValue);
	postgresQuery('UPDATE todo.ttodo SET task = ($1::text) WHERE id = $2::integer',
					[newValue, rowID], function (err, result) {
		if (err) {
			throw err;
		}
	});
}

function taskEdit(_event) {
	var self = this,
		input = document.createElement('input');
	console.log('test');
	self.li.classList.add('editing');

	input.classList.add('edit');
	input.value = this.innerText;
	input.addEventListener('blur', function _self(event) {
		input.removeEventListener('blur', _self);
		self.innerText = input.value;
		taskChange.apply(input, []);
		self.li.classList.remove('editing');
		self.li.removeChild(input);
	});
	input.addEventListener('keypress', function (event) {
		if (event.keyCode === 13) {
			input.removeEventListener('blur', taskChange);

			self.innerText = input.value;
			taskChange.apply(input, []);
			self.li.classList.remove('editing');
			self.li.removeChild(input);
		} else if (event.keyCode === 27) { // esc
			input.removeEventListener('blur', taskChange);

			self.li.classList.remove('editing');
			self.li.removeChild(input);
		}
	});
	self.li.appendChild(input);
	input.focus();
}

function taskDelete(event) {
	var rowID = this.id, self = this;
	postgresQuery('DELETE FROM todo.ttodo WHERE id = $1::integer',
					[rowID], function (err, result) {
		if (err) {
			throw err;
		}

		self.parentNode.parentNode.parentNode.removeChild(self.parentNode.parentNode);
		updateCount();
	});
}

function taskToggle(event) {
	var rowID = this.id, self = this;
	postgresQuery('UPDATE todo.ttodo SET complete = (CASE WHEN complete = -1 THEN 0 ELSE -1 END) WHERE id = $1::integer RETURNING complete',
					[rowID], function (err, result) {
		if (err) {
			throw err;
		}

		self.parentNode.parentNode.classList.toggle('completed');
		self.classList.toggle('unchecked');
		self.classList.toggle('checked');
		updateCount();
	});
}

postgresConnect(function(msg) {
	console.log(msg);
}, function (err) {
	if (err) {
		throw err;
	}

	console.log('connected');

	loadData();

	document.querySelector('.toggle-all').addEventListener('change', function () {
		var newValue = (this.checked ? -1 : 0).toString();
		postgresQuery('UPDATE todo.ttodo SET complete = $1::smallint', [newValue], function (err, result) {
			if (err) {
				throw err;
			}

			loadData();
		});
	});

	document.querySelector('.clear-completed').addEventListener('click', function () {
		var newValue = (this.checked ? -1 : 0).toString();
		postgresQuery('DELETE FROM todo.ttodo WHERE complete = -1', [], function (err, result) {
			if (err) {
				throw err;
			}

			loadData();
		});
	});

	new_todo.addEventListener('keypress', function (event) {
		if (event.keyCode === 13) {
			postgresQuery('INSERT INTO todo.ttodo (task) VALUES ($1::text) RETURNING id', [new_todo.value], function (err, result) {
				if (err) {
					throw err;
				}

				var li = document.createElement('li');
				var div = document.createElement('div');
				var input = document.createElement('input');
				var label = document.createElement('label');
				var button = document.createElement('button');

				input.type = 'checkbox';
				input.classList.add('toggle');
				input.checked = false;
				input.id = result.rows[0].id;
				input.addEventListener('change', taskToggle);
				div.appendChild(input);

				label.innerText = new_todo.value;
				label.addEventListener('dblclick', taskEdit);
				div.appendChild(label);

				button.classList.add('destroy');
				button.id = result.rows[0].id;
				button.addEventListener('click', taskDelete);
				div.appendChild(button);

				div.classList.add('view');
				li.appendChild(div);

				li.label = label;
				label.li = li;
				li.id = result.rows[0].id;

				list.appendChild(li);
				list.insertBefore(li, list.firstChild);
				new_todo.value = '';
				new_todo.focus();

				updateCount();
			});
		}
	});
});

window.onunload = function () {
	postgresClose(function (err) {
		if (err) {
			throw err;
		}

		console.log('close');
	});
};
