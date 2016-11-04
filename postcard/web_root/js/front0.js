var tbody = document.getElementById('data').children[1];
var input = document.getElementById('new_item');

function taskChange(event) {
	var newValue = this.value,
		rowID = this.id;
	postgresQuery('UPDATE todo.ttodo SET task = ($1::text) WHERE id = $2::integer',
					[newValue, rowID], function (err, result) {
		if (err) {
			throw err;
		}
	});
}

function taskDelete(event) {
	var rowID = this.id, tr = this.tr;
	postgresQuery('DELETE FROM todo.ttodo WHERE id = $1::integer',
					[rowID], function (err, result) {
		if (err) {
			throw err;
		}

		tr.parentNode.removeChild(tr);
	});
}

function taskDone(event) {
	var rowID = this.id, self = this;
	postgresQuery('UPDATE todo.ttodo SET complete = (CASE WHEN complete = -1 THEN 0 ELSE -1 END) WHERE id = $1::integer RETURNING complete',
					[rowID], function (err, result) {
		if (err) {
			throw err;
		}

		self.classList.remove(result.rows[0].complete === -1 ? 'unchecked' : 'checked');
		self.classList.add(result.rows[0].complete === -1 ? 'checked' : 'unchecked');
	});
}

postgresConnect(function(msg) {
	console.log(msg);
}, function (err) {
	if (err) {
		throw err;
	}

	console.log('connected');

	input.addEventListener('keypress', function (event) {
		if (event.keyCode === 13) {
			var taskName = input.value;
			postgresQuery('INSERT INTO todo.ttodo (task) VALUES ($1::text) RETURNING id', [input.value], function (err, result) {
				if (err) {
					throw err;
				}

				var tr = document.createElement('tr'),
					td1 = document.createElement('td'),
					div1 = document.createElement('div'),
					td2 = document.createElement('td'),
					div2 = document.createElement('div'),
					newInput = document.createElement('input'),
					td3 = document.createElement('td'),
					div3 = document.createElement('div');

				div1.innerHTML = '&check;'
				div1.classList.add('check');
				div1.classList.add(result.rows[0].complete === -1 ? 'checked' : 'unchecked');
				div1.id = result.rows[0].id;
				div1.addEventListener('click', taskDone);
				td1.appendChild(div1);
				tr.appendChild(td1);

				newInput.id = result.rows[0].id;
				newInput.addEventListener('change', taskChange);
				newInput.value = taskName;
				div2.classList.add('control');
				div2.appendChild(newInput);
				td2.appendChild(div2);
				tr.appendChild(td2);

				div3.innerHTML = '&times;';
				div3.classList.add('delete');
				div3.id = result.rows[0].id;
				div3.tr = tr;
				div3.addEventListener('click', taskDelete);
				td3.appendChild(div3);
				tr.appendChild(td3);

				tbody.insertBefore(tr, tbody.firstChild);
			});
			input.value = '';
			input.focus();
		}
	});

	postgresQuery('SELECT * FROM todo.ttodo ORDER BY id DESC', [], function (err, result) {
		if (err) {
			throw err;
		}

		var i = 0, len = result.rowCount;
		console.log(result);
		for (; i < len; i += 1) {
			var tr = document.createElement('tr'),
				td1 = document.createElement('td'),
				div1 = document.createElement('div'),
				td2 = document.createElement('td'),
				div2 = document.createElement('div'),
				newInput = document.createElement('input'),
				td3 = document.createElement('td'),
				div3 = document.createElement('div');

			div1.innerHTML = '&check;'
			div1.classList.add('check');
			div1.classList.add(result.rows[i].complete === -1 ? 'checked' : 'unchecked');
			div1.id = result.rows[i].id;
			div1.addEventListener('click', taskDone);
			td1.appendChild(div1);
			tr.appendChild(td1);

			newInput.id = result.rows[i].id;
			newInput.addEventListener('change', taskChange);
			newInput.value = result.rows[i].task;
			div2.classList.add('control');
			div2.appendChild(newInput);
			td2.appendChild(div2);
			tr.appendChild(td2);

			div3.innerHTML = '&times;';
			div3.classList.add('delete');
			div3.id = result.rows[i].id;
			div3.tr = tr;
			div3.addEventListener('click', taskDelete);
			td3.appendChild(div3);
			tr.appendChild(td3);

			tbody.appendChild(tr);
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
