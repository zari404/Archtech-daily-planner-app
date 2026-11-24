(() => {
  const $ = id => document.getElementById(id);
  const COLORS = ["#6c63d9","#f0a63f","#4fb985","#ef6b73","#3aa7d9","#c06bd6"];
  const STATUS = {todo:"To do",doing:"In progress",done:"Done",cancelled:"Cancelled"};
  let state = {projects:[],tasks:[]};
  let statusFilter = null, projectFilter = "all", projectView = "all";
  let editingTask = null, editingProject = null, deleteArmed = false;

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6);
  const make = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  };
  const projectById = id => state.projects.find(p => p.id === id);
  const dayKey = value => new Date(value).toDateString();
  const toast = message => {
    const node = $("toast");
    node.textContent = message;
    node.style.display = "block";
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => node.style.display = "none", 2200);
  };

  async function api(url, options = {}) {
    const response = await fetch(url, {
      headers: {"Content-Type":"application/json"},
      ...options
    });
    if (!response.ok) throw new Error("Server request failed");
    return response.json();
  }

  async function save() {
    try {
      await api("/api/data", {
        method: "PUT",
        body: JSON.stringify(state)
      });
      toast("Saved to server");
    } catch (error) {
      toast("Could not save. Check your server connection.");
      console.error(error);
    }
  }

  function render() {
    $("date").textContent = new Date().toLocaleDateString(undefined, {
      weekday:"long",month:"long",day:"numeric"
    });
    renderToday();
    renderProjects();
    renderReport();
  }

  function renderToday() {
    const cards = $("cards");
    cards.innerHTML = "";
    Object.keys(STATUS).forEach(key => {
      const count = state.tasks.filter(task => task.status === key).length;
      const button = make("button","stat "+key);
      button.dataset.status = key;
      button.setAttribute("aria-pressed", statusFilter === key);
      button.append(make("b",null,count),make("span",null,STATUS[key]));
      cards.append(button);
    });

    const filter = $("projFilter");
    filter.innerHTML = "";
    [["all","All projects"],["none","No project"]].forEach(([value,label]) => {
      const option = make("option",null,label);
      option.value = value;
      filter.append(option);
    });
    state.projects.forEach(project => {
      const option = make("option",null,project.name);
      option.value = project.id;
      filter.append(option);
    });
    if (projectFilter !== "all" && projectFilter !== "none" && !projectById(projectFilter)) {
      projectFilter = "all";
    }
    filter.value = projectFilter;
    $("listTitle").textContent = statusFilter ? STATUS[statusFilter]+" tasks" : "All tasks";

    const tasks = state.tasks.filter(task =>
      (!statusFilter || task.status === statusFilter) &&
      (projectFilter === "all" ||
       (projectFilter === "none" ? !task.projectId : task.projectId === projectFilter))
    ).sort((a,b) => b.created-a.created);

    const box = $("tasks");
    box.innerHTML = "";
    if (!tasks.length) {
      const empty = make("div","empty",state.tasks.length ?
        "No tasks match this view." : "You have no tasks yet. Add your first one to get started.");
      if (!state.tasks.length) {
        const add = make("button","btn","+ Add task");
        add.dataset.add = "task";
        empty.append(document.createElement("br"),add);
      }
      box.append(empty);
      return;
    }

    tasks.forEach(task => {
      const row = make("div","task s-"+task.status);
      const check = make("button","chk"+(task.status==="done"?" on":""),task.status==="done"?"✓":"");
      check.setAttribute("aria-label","Toggle task complete");
      check.onclick = async () => {
        task.status = task.status === "done" ? "todo" : "done";
        task.doneAt = task.status === "done" ? Date.now() : null;
        render();
        await save();
      };
      const title = make("button","tt");
      title.append(make("strong",null,task.text));
      const project = projectById(task.projectId);
      const chip = make("span","chip");
      if (project) {
        const dot = make("i");
        dot.style.background = project.color;
        chip.append(dot,document.createTextNode(project.name));
      } else chip.textContent = "No project";
      title.append(chip);
      title.onclick = () => openTask(task);
      row.append(check,title,make("span","badge "+task.status,STATUS[task.status]));
      box.append(row);
    });
  }

  function renderProjects() {
    const box = $("projects");
    box.innerHTML = "";
    if (!state.projects.length) {
      const empty = make("div","empty","No projects yet. Create one to group your tasks.");
      empty.style.gridColumn = "1/-1";
      const add = make("button","btn","+ New project");
      add.dataset.add = "project";
      empty.append(document.createElement("br"),add);
      box.append(empty);
      return;
    }
    let shown = 0;
    state.projects.forEach(project => {
      const tasks = state.tasks.filter(task => task.projectId === project.id && task.status !== "cancelled");
      const completed = tasks.filter(task => task.status === "done").length;
      const percent = tasks.length ? Math.round(completed/tasks.length*100) : 0;
      const isComplete = tasks.length > 0 && percent === 100;
      if ((projectView === "ongoing" && isComplete) || (projectView === "completed" && !isComplete)) return;
      shown++;
      const circumference = 2*Math.PI*26;
      const card = make("button","proj");
      const left = make("div");
      const heading = make("h3",null,project.name);
      const dot = make("i");
      dot.style.cssText = `display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:8px;background:${project.color}`;
      heading.prepend(dot);
      left.append(heading,make("p",null,tasks.length ? `${completed} of ${tasks.length} tasks done` : "No tasks yet"));
      const ring = make("div","ring");
      ring.innerHTML = `<svg viewBox="0 0 68 68" width="68" height="68"><circle cx="34" cy="34" r="26" fill="none" stroke="var(--line)" stroke-width="7"/><circle cx="34" cy="34" r="26" fill="none" stroke="${project.color}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${circumference*(1-percent/100)}" transform="rotate(-90 34 34)"/></svg><b>${percent}%</b>`;
      card.append(left,ring);
      card.onclick = () => openProject(project);
      box.append(card);
    });
    if (!shown) {
      const empty = make("div","empty","No projects in this view.");
      empty.style.gridColumn = "1/-1";
      box.append(empty);
    }
  }

  function renderReport() {
    $("rDone").textContent = state.tasks.filter(t => t.status === "done").length;
    $("rOpen").textContent = state.tasks.filter(t => t.status === "todo" || t.status === "doing").length;
    const now = Date.now(), day = 864e5, data = [];
    for (let i=6;i>=0;i--) {
      const date = new Date(now-i*day), key = date.toDateString();
      data.push({
        label:date.toLocaleDateString(undefined,{weekday:"short"}),
        completed:state.tasks.filter(t => t.doneAt && dayKey(t.doneAt)===key).length,
        added:state.tasks.filter(t => dayKey(t.created)===key).length
      });
    }
    const max = Math.max(3,...data.map(d => Math.max(d.completed,d.added)));
    let bars = '<svg viewBox="0 0 320 160" width="100%" role="img" aria-label="Tasks added and completed in the last 7 days">';
    data.forEach((d,index) => {
      const x=14+index*44, h1=d.completed/max*110, h2=d.added/max*110;
      bars += `<rect x="${x}" y="${125-h1}" width="10" height="${h1}" rx="3" fill="var(--done)"/><rect x="${x+14}" y="${125-h2}" width="10" height="${h2}" rx="3" fill="var(--todo)"/><text x="${x+12}" y="147" text-anchor="middle">${d.label}</text>`;
    });
    $("bars").innerHTML = bars+"</svg>";

    const points = [];
    for (let i=13;i>=0;i--) {
      const key = new Date(now-i*day).toDateString();
      points.push(state.tasks.filter(t => t.doneAt && dayKey(t.doneAt)===key).length);
    }
    const maximum = Math.max(2,...points);
    let path = "";
    points.forEach((value,index) => {
      path += (index?"L":"M")+(10+index*300/13).toFixed(1)+" "+(120-value/maximum*100).toFixed(1);
    });
    $("line").innerHTML = `<svg viewBox="0 0 320 150" width="100%" role="img" aria-label="Tasks completed per day"><path d="${path}L310 130L10 130Z" fill="var(--brand)" opacity=".15"/><path d="${path}" fill="none" stroke="var(--brand)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><text x="10" y="146">14 days ago</text><text x="310" y="146" text-anchor="end">Today</text></svg>`;
  }

  function openTask(task) {
    editingTask = task || null;
    $("tTitle").textContent = task ? "Edit task" : "New task";
    $("tText").value = task ? task.text : "";
    const select = $("tProj");
    select.innerHTML = "";
    const none = make("option",null,"No project");
    none.value = "";
    select.append(none);
    state.projects.forEach(project => {
      const option = make("option",null,project.name);
      option.value = project.id;
      select.append(option);
    });
    select.value = task ? (task.projectId || "") :
      (projectFilter !== "all" && projectFilter !== "none" ? projectFilter : "");
    $("tStatus").value = task ? task.status : "todo";
    $("tDel").style.display = task ? "" : "none";
    $("tDlg").showModal();
    $("tText").focus();
  }

  $("tForm").onsubmit = async event => {
    event.preventDefault();
    const text = $("tText").value.trim();
    if (!text) return;
    const projectId = $("tProj").value || null;
    const status = $("tStatus").value;
    if (editingTask) {
      editingTask.text = text;
      editingTask.projectId = projectId;
      if (editingTask.status !== status) {
        editingTask.status = status;
        editingTask.doneAt = status === "done" ? Date.now() : null;
      }
    } else {
      state.tasks.unshift({
        id:uid(),text,projectId,status,created:Date.now(),
        doneAt:status === "done" ? Date.now() : null
      });
    }
    $("tDlg").close();
    render();
    await save();
  };

  $("tDel").onclick = async () => {
    state.tasks = state.tasks.filter(task => task !== editingTask);
    $("tDlg").close();
    render();
    await save();
  };
  $("tClose").onclick = () => $("tDlg").close();

  function openProject(project) {
    editingProject = project || null;
    deleteArmed = false;
    $("pTitle").textContent = project ? "Edit project" : "New project";
    $("pName").value = project ? project.name : "";
    const box = $("pColors");
    box.innerHTML = "";
    COLORS.forEach((color,index) => {
      const label = make("label");
      const radio = make("input");
      radio.type = "radio";
      radio.name = "pc";
      radio.value = color;
      radio.checked = project ? project.color === color : index === 0;
      const swatch = make("span");
      swatch.style.background = color;
      label.append(radio,swatch);
      box.append(label);
    });
    $("pDel").style.display = project ? "" : "none";
    $("pDel").textContent = "Delete";
    $("pDlg").showModal();
    $("pName").focus();
  }

  $("pForm").onsubmit = async event => {
    event.preventDefault();
    const name = $("pName").value.trim();
    if (!name) return;
    const selected = document.querySelector('input[name="pc"]:checked');
    const color = selected ? selected.value : COLORS[0];
    if (editingProject) {
      editingProject.name = name;
      editingProject.color = color;
    } else {
      state.projects.push({id:uid(),name,color});
    }
    $("pDlg").close();
    render();
    await save();
  };

  $("pDel").onclick = async function() {
    if (!deleteArmed) {
      deleteArmed = true;
      this.textContent = "Tap again to confirm";
      return;
    }
    state.tasks.forEach(task => {
      if (task.projectId === editingProject.id) task.projectId = null;
    });
    state.projects = state.projects.filter(project => project !== editingProject);
    $("pDlg").close();
    render();
    await save();
  };
  $("pClose").onclick = () => $("pDlg").close();

  document.addEventListener("click", event => {
    const add = event.target.closest("[data-add]");
    if (add) {
      add.dataset.add === "task" ? openTask(null) : openProject(null);
      return;
    }
    const nav = event.target.closest("[data-v]");
    if (nav) {
      document.querySelectorAll(".view").forEach(view => view.classList.toggle("on",view.id==="v-"+nav.dataset.v));
      document.querySelectorAll(".nb[data-v]").forEach(button => {
        if (button === nav) button.setAttribute("aria-current","page");
        else button.removeAttribute("aria-current");
      });
      window.scrollTo(0,0);
    }
  });

  $("cards").onclick = event => {
    const button = event.target.closest("[data-status]");
    if (!button) return;
    statusFilter = statusFilter === button.dataset.status ? null : button.dataset.status;
    renderToday();
  };
  $("projFilter").onchange = event => {
    projectFilter = event.target.value;
    renderToday();
  };
  $("pills").onclick = event => {
    const filter = event.target.dataset.f;
    if (!filter) return;
    projectView = filter;
    [...$("pills").children].forEach(button => button.setAttribute("aria-pressed",button.dataset.f===filter));
    renderProjects();
  };
  $("theme").onclick = () => {
    const root = document.documentElement;
    const theme = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = theme;
    localStorage.setItem("planner-theme",theme);
  };

  async function start() {
    const savedTheme = localStorage.getItem("planner-theme");
    if (savedTheme) document.documentElement.dataset.theme = savedTheme;
    try {
      state = await api("/api/data");
      render();
    } catch (error) {
      $("tasks").textContent = "Cannot connect to the server. Start the Node.js server and refresh.";
      console.error(error);
    }
  }
  start();
})();
