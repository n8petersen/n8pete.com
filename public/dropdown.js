const getIdsByClassName = (className) =>
  [...document.getElementsByClassName(className)].map((element) => element.id);

function toggleDropdown(id) {
  var dropdownids = getIdsByClassName("dropdowns");

  // Set all dropdowns to hidden, unless they are the passed id.
  dropdownids.forEach((dropdownId) => {
    dropdownId != id && (document.getElementById(dropdownId).hidden = true);
  });

  // Toggle the passed id's state
  var target = document.getElementById(id)
  target.hidden = !target.hidden
}
