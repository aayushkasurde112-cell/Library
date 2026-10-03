// Library catalogue CRUD behavior for library.html.
// Records live in the page while it is open; persistence can be added later.
const bookForm = document.querySelector('#bookForm');
const bookTable = document.querySelector('#bookTable');
const submitButton = bookForm.querySelector('button[type="button"]');
const countBadge = document.querySelector('.count-badge');
const tableNote = document.querySelector('.table-note');
const totalCount = document.querySelector('.stat-card:nth-child(1) .stat-value');
const availableCount = document.querySelector('.stat-card:nth-child(2) .stat-value');
const checkedOutCount = document.querySelector('.stat-card:nth-child(3) .stat-value');

const titleInput = bookForm.elements.title;
const authorInput = bookForm.elements.author;
const categoryInput = bookForm.elements.category;
const statusInput = bookForm.elements.status;
let editingRow = null;

// Create elements with textContent so book details are displayed as text.
function makeCell(className, content) {
  const cell = document.createElement('td');
  if (className) cell.className = className;
  if (content instanceof Node) cell.append(content);
  else cell.textContent = content;
  return cell;
}

function makeBookRow(book) {
  const row = document.createElement('tr');
  row.dataset.bookId = book.id;

  const titleCell = document.createElement('td');
  const cover = document.createElement('span');
  cover.className = `book-cover ${book.coverClass || 'cover-blue'}`;
  cover.setAttribute('aria-hidden', 'true');
  cover.textContent = book.id.slice(-2);
  const title = document.createElement('span');
  title.className = 'record-name';
  title.textContent = book.title;
  titleCell.append(cover, title);

  const category = document.createElement('span');
  category.className = `category-tag ${categoryClass(book.category)}`.trim();
  category.textContent = book.category;

  const availability = document.createElement('span');
  availability.className = `status ${book.status === 'Available' ? 'available' : 'checked-out'}`;
  const dot = document.createElement('span');
  dot.setAttribute('aria-hidden', 'true');
  availability.append(dot, document.createTextNode(book.status));

  const actionsCell = document.createElement('td');
  const actions = document.createElement('div');
  actions.className = 'row-actions';
  const editButton = document.createElement('button');
  editButton.className = 'icon-button edit';
  editButton.type = 'button';
  editButton.title = 'Update';
  editButton.setAttribute('aria-label', `Update ${book.title} record`);
  editButton.textContent = '✎';
  const deleteButton = document.createElement('button');
  deleteButton.className = 'icon-button delete';
  deleteButton.type = 'button';
  deleteButton.title = 'Delete';
  deleteButton.setAttribute('aria-label', `Delete ${book.title} record`);
  deleteButton.textContent = '⌫';
  actions.append(editButton, deleteButton);
  actionsCell.append(actions);

  row.append(
    makeCell('record-id', book.id),
    titleCell,
    makeCell('muted-cell', book.author),
    makeCell('', category),
    makeCell('', availability),
    actionsCell
  );
  return row;
}

function categoryClass(category) {
  if (category === 'Software') return 'software';
  if (category === 'Algorithms') return 'algorithms';
  return '';
}

function nextBookId() {
  const numbers = [...bookTable.querySelectorAll('.record-id')]
    .map(cell => Number(cell.textContent.replace(/\D/g, '')))
    .filter(Number.isFinite);
  return `B-${String(Math.max(100, ...numbers) + 1).padStart(3, '0')}`;
}

function refreshSummary() {
  const rows = [...bookTable.rows];
  const available = rows.filter(row => row.querySelector('.status')?.classList.contains('available')).length;
  const checkedOut = rows.length - available;
  const countLabel = `${rows.length} ${rows.length === 1 ? 'book' : 'books'}`;

  countBadge.textContent = countLabel;
  tableNote.textContent = `Showing ${rows.length} ${rows.length === 1 ? 'record' : 'records'}`;
  totalCount.textContent = String(rows.length).padStart(2, '0');
  availableCount.textContent = String(available).padStart(2, '0');
  checkedOutCount.textContent = String(checkedOut).padStart(2, '0');
}

function clearEditingState() {
  editingRow = null;
  bookForm.reset();
  submitButton.innerHTML = '<span aria-hidden="true">＋</span> Add book to catalogue';
  bookForm.querySelector('.cancel-edit')?.remove();
  document.querySelector('#add-book-title').textContent = 'Add a book';
}

function addCancelButton() {
  if (bookForm.querySelector('.cancel-edit')) return;
  const cancel = document.createElement('button');
  cancel.className = 'button cancel-edit';
  cancel.type = 'button';
  cancel.textContent = 'Cancel';
  cancel.addEventListener('click', clearEditingState);
  submitButton.parentElement.append(cancel);
}

function startEditing(row) {
  editingRow = row;
  titleInput.value = row.cells[1].querySelector('.record-name').textContent;
  authorInput.value = row.cells[2].textContent;
  categoryInput.value = row.cells[3].textContent.trim();
  statusInput.value = row.cells[4].querySelector('.status').textContent.trim();
  submitButton.innerHTML = '<span aria-hidden="true">✓</span> Save changes';
  document.querySelector('#add-book-title').textContent = `Update book · ${row.cells[0].textContent}`;
  addCancelButton();
  document.querySelector('#add-book').scrollIntoView({ behavior: 'smooth' });
  titleInput.focus({ preventScroll: true });
}

function formIsValid() {
  if (bookForm.reportValidity()) return true;
  return false;
}

submitButton.addEventListener('click', () => {
  if (!formIsValid()) return;

  const book = {
    id: editingRow ? editingRow.cells[0].textContent : nextBookId(),
    title: titleInput.value.trim(),
    author: authorInput.value.trim(),
    category: categoryInput.value,
    status: statusInput.value,
    coverClass: editingRow?.querySelector('.book-cover').classList[1]
  };
  if (!book.title || !book.author) return;

  const newRow = makeBookRow(book);
  if (editingRow) editingRow.replaceWith(newRow);
  else bookTable.append(newRow);

  clearEditingState();
  refreshSummary();
});

// Event delegation lets the same handlers work for original and new rows.
bookTable.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  const row = button.closest('tr');

  if (button.classList.contains('edit')) {
    startEditing(row);
  } else if (button.classList.contains('delete')) {
    if (editingRow === row) clearEditingState();
    row.remove();
    refreshSummary();
  }
});

// Keep the form usable with Enter as well as the visible button.
bookForm.addEventListener('submit', event => {
  event.preventDefault();
  submitButton.click();
});

refreshSummary();
