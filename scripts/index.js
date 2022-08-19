const svgIcon = {
    star: {
      path: '<path fill-rule="evenodd" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25zm0 2.445L6.615 5.5a.75.75 0 01-.564.41l-3.097.45 2.24 2.184a.75.75 0 01.216.664l-.528 3.084 2.769-1.456a.75.75 0 01.698 0l2.77 1.456-.53-3.084a.75.75 0 01.216-.664l2.24-2.183-3.096-.45a.75.75 0 01-.564-.41L8 2.694v.001z"></path>',
      attributes: {
        width: 16,
        height: 16,
      },
    },
    delete: {
      path: '<path stroke-linecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>',
      attributes: {
        width: 24,
        height: 24,
        viewBox: "0 0 24 24",
        "stroke-width": "1.5",
        fill: "none",
        stroke: "currentColor",
      },
    },
  },
  requestURL = "https://api.github.com/search/repositories?q=",
  searchDropdown = document.querySelector(".search__dropdown"),
  searchInput = document.querySelector(".search__input"),
  searchLoading = document.querySelector(".search__loading"),
  repositoriesWrapper = document.querySelector(".repositories__wrapper"),
  form = document.getElementsByTagName("form")[0],
  validKeys = /[a-zA-Z0-9\/]/g;

form.addEventListener("keypress", (event) => {
  if (event.keyCode === 13) event.preventDefault();
});

function removeInvalidChars(string) {
  return string
    .split("")
    .filter((elem) => {
      return elem.match(validKeys);
    })
    .join("");
}

function debounce(func, delay) {
  let inDebounce;
  return function () {
    const context = this,
      args = arguments;
    clearTimeout(inDebounce);
    inDebounce = setTimeout(() => func.apply(context, args), delay);
  };
}

function generateSvgIcon(name) {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.innerHTML = svgIcon[name].path;

  for (key in svgIcon[name].attributes) {
    icon.setAttribute(key, svgIcon[name].attributes[key]);
  }

  return icon;
}

function addRepository(parent, data) {
  const fragment = document.createDocumentFragment(),
    repository = document.createElement("div"),
    repositoryHeader = document.createElement("h4"),
    repositoryLink = document.createElement("a"),
    repositoryAuthor = document.createElement("span"),
    repositoryStargazer = document.createElement("div"),
    repositoryStargazerCounter = document.createElement("span"),
    repositoryStargazerIcon = generateSvgIcon("star"),
    repositoryDeleteButton = document.createElement("div"),
    repositoryDeleteIcon = generateSvgIcon("delete");

  repository.classList.add("repository");
  repositoryHeader.classList.add("repository__header");
  repositoryAuthor.classList.add("repository__author");
  repositoryStargazer.classList.add("repository__stars-wrapper");
  repositoryStargazerCounter.classList.add("repository__stars-counter");
  repositoryDeleteButton.classList.add("repository__delete-button");

  repositoryLink.textContent = data.name;
  repositoryAuthor.textContent = `By ${data.owner.login}`;
  repositoryStargazerCounter.textContent = data.stargazers_count;

  repositoryStargazer.appendChild(repositoryStargazerIcon);
  repositoryStargazer.appendChild(repositoryStargazerCounter);
  repositoryHeader.appendChild(repositoryLink);
  repositoryDeleteButton.appendChild(repositoryDeleteIcon);
  repository.appendChild(repositoryHeader);
  repository.appendChild(repositoryAuthor);
  repository.appendChild(repositoryStargazer);
  repository.appendChild(repositoryDeleteButton);
  fragment.appendChild(repository);

  repositoryLink.setAttribute("href", data.html_url);
  repositoryLink.setAttribute("target", "_blank");
  repositoryLink.setAttribute(
    "title",
    `Go to repository "${data.name}" on github`
  );

  repositoryDeleteIcon.addEventListener("click", () => {
    repository.style.animation = "delete .3s linear";
  });

  repository.addEventListener("animationend", (event) => {
    if (event.animationName === "delete") {
      repository.remove();
    }
  });

  parent.appendChild(fragment);
}

function onChange(event) {
  event.target.value = removeInvalidChars(event.target.value);

  if (event.target.value.length !== 0) {
    if(event.key.length === 1){
    searchLoading.classList.add("search__loading--active");

    while (searchDropdown.firstChild) {
      searchDropdown.removeChild(searchDropdown.lastChild);
    }
    generateDropdown(event.target.value);
  }
  }else{
    searchDropdown.classList.remove("search__dropdown--active");
  }
}

onChange = debounce(onChange, 500);

searchInput.addEventListener("keyup", onChange);

function fetchData(url) {
  return fetch(url).then((response) => {
    if (response.ok) {
      return response.json();
    }
    return response.json().then(() => {
      const fragment = document.createDocumentFragment(),
        item = document.createElement("div");
      item.classList.add("item");

      item.textContent = "Server error. Try again later...";
      fragment.appendChild(item);
      searchDropdown.appendChild(fragment);
      searchLoading.classList.remove("search__loading--active");
      searchDropdown.classList.add("search__dropdown--active");
    });
  });
}

function generateDropdown(value) {
  searchDropdown.classList.remove("search__dropdown--active");
  fetchData(requestURL + value + "&per_page=5")
    .then((data) => {
      if (!data) {
        return;
      }
      const repositories = data.items,
        fragment = document.createDocumentFragment();
      if (!repositories.length) {
        const item = document.createElement("div");
        item.classList.add("item");
        item.textContent = "No results found";
        fragment.appendChild(item);
      } else {
        repositories.forEach((data) => {
          const item = document.createElement("div");
          item.classList.add("item");
          item.innerHTML = data.full_name;
          item.setAttribute(
            "title",
            `Click to add "${data.name}" to your repositories.`
          );
          item.addEventListener("click", () => {
            searchInput.value = "";
            searchDropdown.classList.remove("search__dropdown--active");
            addRepository(repositoriesWrapper, data);
          });
          fragment.appendChild(item);
        });
      }

      searchDropdown.appendChild(fragment);
      searchLoading.classList.remove("search__loading--active");
      searchDropdown.classList.add("search__dropdown--active");
    })
    .catch((error) => {
      console.error(error);
      return true;
    });
}
